# Portable packages

This directory contains reusable instructions derived from the Aptitude Map
project. The packages are universal: they contain no personal profile data and
do not require a particular agent harness, model, operating system, or tool
name.

- `skills/` contains standard Agent Skill directories. Every skill links a
  [SkillMeta](https://github.com/innerlattice/skillmeta) `skill.json` manifest.
- `agents/` contains portable agent instructions, state contracts, and a small
  adapter boundary that a harness can implement.

SkillMeta applies to Agent Skills, not to agent-role packages. The agent
manifest in this repository therefore uses the documented local
`agent-package.schema.json`; its instructions and adapter contract remain
harness-independent, but the manifest is not presented as an industry standard.

Personal ratings, notes, routing decisions, and evidence remain under the
gitignored `private/` directory. Packages may consume an authorized summary or
policy at runtime, but must never embed one person's identity or preferences in
their universal core.

Run `npm run test:packages` to check local paths, package invariants, and eval
case structure. Run the SkillMeta reference validator separately for complete
manifest validation.
