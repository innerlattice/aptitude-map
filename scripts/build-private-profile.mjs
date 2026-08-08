#!/usr/bin/env node

import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROUTE_DEFINITIONS = Object.freeze({
  "own-distill": "Keep personal judgment and turn the repeatable method into reusable instructions and evaluations.",
  "learn-govern": "Learn enough to set requirements, judge evidence, and supervise another executor.",
  "delegate-automate": "Route recurring execution to an agent, person, service, or managed platform with explicit controls.",
  "avoid-defer": "Do not invest now unless a concrete goal changes the outcome's criticality.",
});

function usage() {
  return [
    "Usage:",
    "  node scripts/build-private-profile.mjs --input <export.json> --output-dir <private/path> [--baseline-version v1] [--created-at <ISO-8601>]",
    "",
    "The output directory must not already exist. This command never overwrites a baseline.",
  ].join("\n");
}

function parseArgs(argv) {
  const options = { baselineVersion: "v1", createdAt: new Date().toISOString() };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];

    if (argument === "--help" || argument === "-h") {
      return { help: true };
    }
    if (!["--input", "--output-dir", "--baseline-version", "--created-at"].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}\n\n${usage()}`);
    }
    if (!value) {
      throw new Error(`Missing value for ${argument}\n\n${usage()}`);
    }

    if (argument === "--input") options.input = resolve(value);
    if (argument === "--output-dir") options.outputDir = resolve(value);
    if (argument === "--baseline-version") options.baselineVersion = value;
    if (argument === "--created-at") options.createdAt = value;
    index += 1;
  }

  if (!options.input || !options.outputDir) {
    throw new Error(`--input and --output-dir are required.\n\n${usage()}`);
  }
  if (!options.baselineVersion.trim()) {
    throw new Error("--baseline-version cannot be empty.");
  }
  if (Number.isNaN(Date.parse(options.createdAt))) {
    throw new Error("--created-at must be an ISO-8601 timestamp.");
  }

  return options;
}

function assertIntegerInRange(value, minimum, maximum, label) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
}

export function validateExport(profile) {
  if (!profile || profile.schemaVersion !== 2) {
    throw new Error("Expected an Aptitude Map schema version 2 export.");
  }

  for (const field of ["questionSets", "questions", "responses"]) {
    if (!Array.isArray(profile[field]) || profile[field].length === 0) {
      throw new Error(`${field} must be a non-empty array.`);
    }
  }

  const questionSetIds = new Set(profile.questionSets.map((item) => item.id));
  const questionIds = new Set(profile.questions.map((item) => item.id));
  const responseIds = new Set(profile.responses.map((item) => item.id));
  const responseQuestionIds = new Set(profile.responses.map((item) => item.questionId));

  if (questionSetIds.size !== profile.questionSets.length) {
    throw new Error("Question-set IDs must be unique.");
  }
  if (questionIds.size !== profile.questions.length) {
    throw new Error("Question IDs must be unique.");
  }
  if (responseIds.size !== profile.responses.length) {
    throw new Error("Response IDs must be unique.");
  }
  if (responseQuestionIds.size !== profile.responses.length) {
    throw new Error("Every capability must have exactly one response.");
  }
  if (profile.questions.length !== profile.responses.length) {
    throw new Error("A frozen baseline requires one response for every capability.");
  }

  for (const question of profile.questions) {
    if (!questionSetIds.has(question.questionSetId)) {
      throw new Error(`Question ${question.id} references an unknown question set.`);
    }
    if (!responseQuestionIds.has(question.id)) {
      throw new Error(`Question ${question.id} has no response.`);
    }
  }

  for (const response of profile.responses) {
    if (!questionIds.has(response.questionId)) {
      throw new Error(`Response ${response.id} references an unknown question.`);
    }
    assertIntegerInRange(response.ability, 0, 5, `Ability for ${response.questionId}`);
    assertIntegerInRange(response.energy, -2, 2, `Energy for ${response.questionId}`);
    assertIntegerInRange(response.criticality, 0, 3, `Criticality for ${response.questionId}`);
  }
}

export function suggestRoute({ ability, energy, criticality }) {
  if (criticality <= 1) {
    return {
      route: "avoid-defer",
      rationale: "The outcome is currently irrelevant or merely useful, so it should not consume scarce attention without a new goal.",
    };
  }
  if (energy < 0) {
    return {
      route: "delegate-automate",
      rationale: "The outcome matters, but repeated execution is disliked; retain oversight while moving the work elsewhere.",
    };
  }
  if (ability <= 2) {
    return {
      route: "learn-govern",
      rationale: "The outcome matters and current ability is below independent performance; learn the control points and evaluation criteria.",
    };
  }
  return {
    route: "own-distill",
    rationale: "The outcome matters, performance is independent or stronger, and the work is not disliked; preserve and externalize the method.",
  };
}

async function writePrivateJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  await chmod(path, 0o600);
}

export async function buildBaseline({ input, outputDir, baselineVersion, createdAt }) {
  try {
    await access(outputDir, constants.F_OK);
    throw new Error(`Refusing to overwrite existing baseline directory: ${outputDir}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const sourceBytes = await readFile(input);
  const profile = JSON.parse(sourceBytes.toString("utf8"));
  validateExport(profile);

  const sha256 = createHash("sha256").update(sourceBytes).digest("hex");
  const questionById = new Map(profile.questions.map((item) => [item.id, item]));

  const capabilities = profile.responses.map((response) => {
    const question = questionById.get(response.questionId);
    const suggestion = suggestRoute(response);
    return {
      id: question.id,
      questionSetId: question.questionSetId,
      code: question.code,
      title: question.title,
      ratings: {
        ability: response.ability,
        energy: response.energy,
        criticality: response.criticality,
      },
      ...suggestion,
    };
  });

  const manifest = {
    schemaVersion: 1,
    baselineVersion,
    createdAt,
    frozen: true,
    source: {
      file: "aptitude-map.json",
      sha256,
      exportSchemaVersion: profile.schemaVersion,
    },
    counts: {
      questionSets: profile.questionSets.length,
      questions: profile.questions.length,
      responses: profile.responses.length,
      completeResponses: profile.responses.length,
    },
  };

  const routing = {
    schemaVersion: 1,
    baselineVersion,
    createdAt,
    sourceSha256: sha256,
    policyVersion: "1.0.0",
    routeDefinitions: ROUTE_DEFINITIONS,
    capabilities,
  };

  const evidence = {
    schemaVersion: 1,
    baselineVersion,
    updatedAt: createdAt,
    claims: [],
  };

  await mkdir(dirname(outputDir), { recursive: true, mode: 0o700 });
  await mkdir(outputDir, { recursive: false, mode: 0o700 });
  await writeFile(resolve(outputDir, "aptitude-map.json"), sourceBytes, {
    flag: "wx",
    mode: 0o600,
  });
  await chmod(resolve(outputDir, "aptitude-map.json"), 0o600);
  await writePrivateJson(resolve(outputDir, "manifest.json"), manifest);
  await writePrivateJson(resolve(outputDir, "routing.json"), routing);
  await writePrivateJson(resolve(outputDir, "evidence.json"), evidence);

  return {
    outputDir,
    input: basename(input),
    sha256,
    counts: manifest.counts,
    routes: Object.fromEntries(
      Object.keys(ROUTE_DEFINITIONS).map((route) => [
        route,
        capabilities.filter((item) => item.route === route).length,
      ]),
    ),
  };
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    const summary = await buildBaseline(options);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
