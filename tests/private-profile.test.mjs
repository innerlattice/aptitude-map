import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildBaseline,
  suggestRoute,
  validateExport,
} from "../scripts/build-private-profile.mjs";
import { applyRoutingOverrides } from "../scripts/apply-routing-overrides.mjs";

function sampleExport() {
  return {
    schemaVersion: 2,
    profile: {
      id: "00000000-0000-4000-8000-000000000001",
      schemaVersion: 2,
      title: "Sample",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    questionSets: [
      {
        id: "00000000-0000-4000-8000-000000000002",
        profileId: "00000000-0000-4000-8000-000000000001",
        code: "ONE",
        title: "One",
        description: "One set",
        position: 0,
        archivedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    questions: [
      {
        id: "00000000-0000-4000-8000-000000000003",
        questionSetId: "00000000-0000-4000-8000-000000000002",
        code: "ONE-1",
        title: "First",
        detail: "First capability",
        position: 0,
        archivedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    responses: [
      {
        id: "00000000-0000-4000-8000-000000000004",
        questionId: "00000000-0000-4000-8000-000000000003",
        ability: 5,
        energy: 2,
        criticality: 3,
        note: "Sample note",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  };
}

test("suggestRoute keeps the four routes mutually exclusive", () => {
  assert.equal(suggestRoute({ ability: 5, energy: 2, criticality: 3 }).route, "own-distill");
  assert.equal(suggestRoute({ ability: 1, energy: 1, criticality: 3 }).route, "learn-govern");
  assert.equal(suggestRoute({ ability: 4, energy: -1, criticality: 3 }).route, "delegate-automate");
  assert.equal(suggestRoute({ ability: 5, energy: 2, criticality: 1 }).route, "avoid-defer");
});

test("buildBaseline creates a complete private snapshot without changing the source", async (context) => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "aptitude-profile-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const input = resolve(temporaryRoot, "source.json");
  const outputDir = resolve(temporaryRoot, "profile", "v1");
  const source = `${JSON.stringify(sampleExport(), null, 2)}\n`;
  await writeFile(input, source, "utf8");

  const summary = await buildBaseline({
    input,
    outputDir,
    baselineVersion: "v1",
    createdAt: "2026-08-08T00:00:00.000Z",
  });

  assert.equal(summary.counts.completeResponses, 1);
  assert.equal(summary.routes["own-distill"], 1);
  assert.equal(await readFile(resolve(outputDir, "aptitude-map.json"), "utf8"), source);
  assert.equal(JSON.parse(await readFile(resolve(outputDir, "routing.json"), "utf8")).capabilities.length, 1);
});

test("buildBaseline refuses to overwrite a frozen directory", async (context) => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "aptitude-profile-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const input = resolve(temporaryRoot, "source.json");
  const outputDir = resolve(temporaryRoot, "v1");
  await writeFile(input, JSON.stringify(sampleExport()), "utf8");

  const options = {
    input,
    outputDir,
    baselineVersion: "v1",
    createdAt: "2026-08-08T00:00:00.000Z",
  };
  await buildBaseline(options);
  await assert.rejects(buildBaseline(options), /Refusing to overwrite/);
});

test("validateExport rejects incomplete ratings", () => {
  const profile = sampleExport();
  profile.responses[0].ability = null;
  assert.throws(() => validateExport(profile), /Ability/);
});

test("applyRoutingOverrides matches stable IDs, removes stale facets, and keeps a backup", async (context) => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "aptitude-routing-test-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));
  const routing = resolve(temporaryRoot, "routing.json");
  const overrides = resolve(temporaryRoot, "overrides.json");
  await writeFile(
    routing,
    JSON.stringify({
      schemaVersion: 1,
      baselineVersion: "v1",
      capabilities: [
        { id: "one", code: "ONE-1", facets: [{ name: "stale" }] },
        { id: "two", code: "ONE-2" },
      ],
    }),
  );
  await writeFile(
    overrides,
    JSON.stringify({
      schemaVersion: 1,
      baselineVersion: "v1",
      capabilities: [
        {
          id: "two",
          code: "ONE-2",
          facets: [
            { name: "Judge", route: "own-distill", rationale: "Keep judgment." },
            { name: "Run", route: "delegate-automate", rationale: "Move operation." },
          ],
        },
      ],
    }),
  );

  const summary = await applyRoutingOverrides({ routing, overrides });
  const reviewed = JSON.parse(await readFile(routing, "utf8"));
  assert.equal("facets" in reviewed.capabilities[0], false);
  assert.equal(reviewed.capabilities[1].facets.length, 2);
  assert.match(summary.backup, /routing\.backup-/);
  assert.equal(JSON.parse(await readFile(summary.backup, "utf8")).capabilities[0].facets[0].name, "stale");
});
