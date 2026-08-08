#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = resolve(repositoryRoot, "packages", "skills");
const agentRoot = resolve(repositoryRoot, "packages", "agents");
const evalRoot = resolve(repositoryRoot, "evals");
const skillmetaSchema =
  "https://raw.githubusercontent.com/innerlattice/skillmeta/schema-v0.3.0/src/skillmeta/schema/v0.3/skill.schema.json";
const canonicalName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semanticVersion = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function assertFile(path) {
  try {
    await access(path);
  } catch {
    throw new Error(`Missing required file: ${path}`);
  }
}

function parseSkillFrontmatter(source, path) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  assert(match, `${path} must start with YAML frontmatter.`);
  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const license = frontmatter.match(/^license:\s*(.+)$/m)?.[1]?.trim();
  const manifest = frontmatter.match(/^\s{2}skillmeta\.manifest:\s*(.+)$/m)?.[1]?.trim();
  assert(name, `${path} needs a frontmatter name.`);
  assert(description, `${path} needs a frontmatter description.`);
  assert(license, `${path} needs a frontmatter license.`);
  assert(manifest, `${path} must link metadata.skillmeta.manifest.`);
  return { name, description, license, manifest };
}

function validateUniversalCore(source, path) {
  const forbidden = [
    /\/Users\//,
    /\.codex\//i,
    /\.claude\//i,
    /must use (?:codex|chatgpt|claude)/i,
    /Ben Hohner/,
  ];
  for (const pattern of forbidden) {
    assert(!pattern.test(source), `${path} leaks a personal or harness-specific core assumption: ${pattern}`);
  }
}

async function validateSkill(directoryName) {
  assert(canonicalName.test(directoryName), `Invalid skill directory name: ${directoryName}`);
  const directory = resolve(skillRoot, directoryName);
  const skillPath = resolve(directory, "SKILL.md");
  const source = await readFile(skillPath, "utf8");
  const frontmatter = parseSkillFrontmatter(source, skillPath);
  assert(frontmatter.name === directoryName, `${skillPath} name must match its directory.`);
  validateUniversalCore(source, skillPath);

  const manifestPath = resolve(directory, frontmatter.manifest);
  const manifest = await readJson(manifestPath);
  assert(manifest.manifestSchema === skillmetaSchema, `${manifestPath} must use SkillMeta v0.3.`);
  assert(manifest.name === directoryName, `${manifestPath} name must match the skill.`);
  assert(manifest.license === frontmatter.license, `${manifestPath} license must match SKILL.md.`);
  assert(semanticVersion.test(manifest.version), `${manifestPath} needs a semantic version.`);
  assert(Array.isArray(manifest.creators) && manifest.creators.length > 0, `${manifestPath} needs a creator.`);
  assert(
    Array.isArray(manifest.targets) &&
      manifest.targets.length === 1 &&
      manifest.targets[0]?.kind === "universal",
    `${manifestPath} must declare only the universal target.`,
  );
  assert(Array.isArray(manifest.requirements), `${manifestPath} requirements must be an array.`);
  assert(
    manifest.repository?.path === `packages/skills/${directoryName}`,
    `${manifestPath} repository path is inconsistent.`,
  );

  const markdownLinks = [...source.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const link of markdownLinks.filter((value) => !value.includes(":") && !value.startsWith("#"))) {
    await assertFile(resolve(directory, link));
  }

  const evalDirectory = resolve(evalRoot, directoryName);
  const cases = await readJson(resolve(evalDirectory, "cases.json"));
  const selection = await readJson(resolve(evalDirectory, "selection.json"));
  assert(Array.isArray(cases) && cases.length >= 2 && cases.length <= 7, `${directoryName} needs 2-7 eval cases.`);
  for (const testCase of cases) {
    assert(testCase.id && testCase.prompt && testCase.expected && Array.isArray(testCase.files), `Invalid ${directoryName} eval case.`);
  }
  for (const field of ["shouldLoad", "shouldNotLoad", "ambiguous"]) {
    assert(Array.isArray(selection[field]) && selection[field].length > 0, `${directoryName} selection ${field} is empty.`);
  }

  return { name: directoryName, evalCases: cases.length };
}

async function validateAgent(directoryName) {
  assert(canonicalName.test(directoryName), `Invalid agent directory name: ${directoryName}`);
  const directory = resolve(agentRoot, directoryName);
  const manifestPath = resolve(directory, "agent.json");
  const manifest = await readJson(manifestPath);
  assert(manifest.schemaVersion === 1, `${manifestPath} must use schema version 1.`);
  assert(manifest.name === directoryName, `${manifestPath} name must match its directory.`);
  assert(semanticVersion.test(manifest.version), `${manifestPath} needs a semantic version.`);
  assert(
    Array.isArray(manifest.targets) &&
      manifest.targets.length === 1 &&
      manifest.targets[0]?.kind === "universal",
    `${manifestPath} must declare only the universal target.`,
  );
  assert(Array.isArray(manifest.skills) && manifest.skills.length <= 7, `${manifestPath} declares too many skills.`);
  await assertFile(resolve(directory, manifest.entrypoint));
  await assertFile(resolve(directory, manifest.defaults.stateSchema));

  for (const skill of manifest.skills) {
    const skillPath = resolve(directory, skill.path);
    await assertFile(resolve(skillPath, "SKILL.md"));
    const skillSource = await readFile(resolve(skillPath, "SKILL.md"), "utf8");
    assert(parseSkillFrontmatter(skillSource, skillPath).name === skill.name, `Agent skill path does not match ${skill.name}.`);
  }

  const capabilityIds = manifest.adapter?.requiredCapabilities?.map((item) => item.id) ?? [];
  assert(
    JSON.stringify(capabilityIds) ===
      JSON.stringify(["instructions.load", "state.read-write", "skills.invoke", "approval.request"]),
    `${manifestPath} adapter boundary changed unexpectedly.`,
  );
  assert(manifest.defaults.authority === "advisory", `${manifestPath} must default to advisory authority.`);
  assert(manifest.defaults.maxActiveWorkItems >= 1 && manifest.defaults.maxActiveWorkItems <= 7, `${manifestPath} active-work limit is invalid.`);

  const entrypoint = await readFile(resolve(directory, manifest.entrypoint), "utf8");
  validateUniversalCore(entrypoint, resolve(directory, manifest.entrypoint));
  const cases = await readJson(resolve(evalRoot, directoryName, "cases.json"));
  assert(Array.isArray(cases) && cases.length >= 2 && cases.length <= 7, `${directoryName} needs 2-7 eval cases.`);
  for (const testCase of cases) {
    assert(testCase.id && testCase.prompt && testCase.expected, `Invalid ${directoryName} eval case.`);
  }

  return { name: directoryName, evalCases: cases.length };
}

async function main() {
  const skillDirectories = (await readdir(skillRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const agentDirectories = (await readdir(agentRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert(skillDirectories.length > 0 && skillDirectories.length <= 7, "Expected 1-7 portable skills.");
  assert(agentDirectories.length > 0 && agentDirectories.length <= 7, "Expected 1-7 portable agents.");

  const skills = [];
  for (const directory of skillDirectories) skills.push(await validateSkill(directory));
  const agents = [];
  for (const directory of agentDirectories) agents.push(await validateAgent(directory));

  const schemaPaths = [
    "schemas/profile-baseline-manifest.schema.json",
    "schemas/capability-routing.schema.json",
    "schemas/profile-evidence.schema.json",
    "packages/agents/agent-package.schema.json",
    "packages/agents/operator/work-state.schema.json",
  ];
  for (const path of schemaPaths) await readJson(resolve(repositoryRoot, path));

  process.stdout.write(`${JSON.stringify({ skills, agents, schemas: schemaPaths.length }, null, 2)}\n`);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
