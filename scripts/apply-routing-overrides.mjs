#!/usr/bin/env node

import { constants } from "node:fs";
import { chmod, copyFile, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROUTES = new Set([
  "own-distill",
  "learn-govern",
  "delegate-automate",
  "avoid-defer",
]);

function usage() {
  return [
    "Usage:",
    "  node scripts/apply-routing-overrides.mjs --routing <routing.json> --overrides <overrides.json>",
    "",
    "Every override must include both the stable capability UUID and expected code.",
    "The command clears stale facets, creates a backup, and atomically replaces routing.json.",
  ].join("\n");
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (!["--routing", "--overrides"].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}\n\n${usage()}`);
    }
    if (!value) throw new Error(`Missing value for ${argument}\n\n${usage()}`);
    if (argument === "--routing") options.routing = resolve(value);
    if (argument === "--overrides") options.overrides = resolve(value);
    index += 1;
  }
  if (!options.routing || !options.overrides) {
    throw new Error(`--routing and --overrides are required.\n\n${usage()}`);
  }
  return options;
}

function validateFacet(facet, capabilityCode) {
  if (!facet || typeof facet.name !== "string" || !facet.name.trim()) {
    throw new Error(`Every ${capabilityCode} facet needs a non-empty name.`);
  }
  if (!ROUTES.has(facet.route)) {
    throw new Error(`Unknown route ${facet.route} in ${capabilityCode}.`);
  }
  if (typeof facet.rationale !== "string" || !facet.rationale.trim()) {
    throw new Error(`Every ${capabilityCode} facet needs a non-empty rationale.`);
  }
}

function validateOverrides(overrides) {
  if (!overrides || overrides.schemaVersion !== 1 || !Array.isArray(overrides.capabilities)) {
    throw new Error("Expected routing overrides schema version 1 with a capabilities array.");
  }
  const ids = new Set();
  for (const capability of overrides.capabilities) {
    if (typeof capability.id !== "string" || typeof capability.code !== "string") {
      throw new Error("Every routing override needs an id and code.");
    }
    if (ids.has(capability.id)) {
      throw new Error(`Duplicate override for capability ${capability.id}.`);
    }
    ids.add(capability.id);
    if (!Array.isArray(capability.facets) || capability.facets.length < 2 || capability.facets.length > 7) {
      throw new Error(`${capability.code} must contain from 2 to 7 facets.`);
    }
    capability.facets.forEach((facet) => validateFacet(facet, capability.code));
    const names = new Set(capability.facets.map((facet) => facet.name));
    if (names.size !== capability.facets.length) {
      throw new Error(`${capability.code} facet names must be unique.`);
    }
  }
}

export async function applyRoutingOverrides({ routing, overrides }) {
  const routingDocument = JSON.parse(await readFile(routing, "utf8"));
  const overrideDocument = JSON.parse(await readFile(overrides, "utf8"));
  validateOverrides(overrideDocument);

  if (routingDocument.schemaVersion !== 1 || !Array.isArray(routingDocument.capabilities)) {
    throw new Error("Expected a capability routing schema version 1 document.");
  }
  if (routingDocument.baselineVersion !== overrideDocument.baselineVersion) {
    throw new Error("Routing and override baseline versions do not match.");
  }

  const capabilityById = new Map(
    routingDocument.capabilities.map((capability) => {
      const withoutFacets = { ...capability };
      delete withoutFacets.facets;
      return [capability.id, withoutFacets];
    }),
  );

  for (const override of overrideDocument.capabilities) {
    const capability = capabilityById.get(override.id);
    if (!capability) {
      throw new Error(`No capability has UUID ${override.id}.`);
    }
    if (capability.code !== override.code) {
      throw new Error(
        `Capability ${override.id} is ${capability.code}, not expected code ${override.code}.`,
      );
    }
    capability.facets = override.facets;
  }

  const reviewed = {
    ...routingDocument,
    capabilities: routingDocument.capabilities.map((capability) => capabilityById.get(capability.id)),
  };
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const extension = extname(routing);
  const backup = `${routing.slice(0, -extension.length)}.backup-${timestamp}${extension}`;
  const temporary = resolve(dirname(routing), `.routing-${timestamp}.tmp`);

  await copyFile(routing, backup, constants.COPYFILE_EXCL);
  await chmod(backup, 0o600);
  await writeFile(temporary, `${JSON.stringify(reviewed, null, 2)}\n`, {
    flag: "wx",
    mode: 0o600,
  });
  await rename(temporary, routing);
  await chmod(routing, 0o600);

  return {
    routing,
    backup,
    capabilities: reviewed.capabilities.length,
    reviewedCapabilities: overrideDocument.capabilities.length,
    facets: overrideDocument.capabilities.reduce((sum, item) => sum + item.facets.length, 0),
  };
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    process.stdout.write(`${JSON.stringify(await applyRoutingOverrides(options), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
