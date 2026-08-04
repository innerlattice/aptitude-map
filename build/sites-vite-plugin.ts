import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

interface HostingConfig {
  project_id?: string;
  d1: string | null;
  r2: string | null;
}

const HOSTING_CONFIG_CANDIDATES = ["hosting.json", "hosting.example.json"];

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function resolveHostingConfigPath(root: string): Promise<string> {
  for (const filename of HOSTING_CONFIG_CANDIDATES) {
    const candidate = resolve(root, ".openai", filename);
    if (await exists(candidate)) return candidate;
  }

  throw new Error(
    "Missing .openai/hosting.json and .openai/hosting.example.json. Restore the template before building."
  );
}

export async function loadHostingConfig(
  root = process.cwd()
): Promise<HostingConfig> {
  const path = await resolveHostingConfigPath(root);
  const config = JSON.parse(await readFile(path, "utf8")) as Partial<HostingConfig>;

  if (config.d1 !== null && typeof config.d1 !== "string") {
    throw new Error(`Invalid d1 binding in ${path}`);
  }
  if (config.r2 !== null && typeof config.r2 !== "string") {
    throw new Error(`Invalid r2 binding in ${path}`);
  }

  return {
    ...(typeof config.project_id === "string"
      ? { project_id: config.project_id }
      : {}),
    d1: config.d1 ?? null,
    r2: config.r2 ?? null,
  };
}

// Packages Sites metadata and migrations after Vite finishes compiling.
export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const outputDirectory = resolve(root, "dist", ".openai");
      const hostingConfig = await resolveHostingConfigPath(root);
      const drizzleSource = resolve(root, "drizzle");

      await rm(outputDirectory, { recursive: true, force: true });
      await mkdir(outputDirectory, { recursive: true });

      await cp(hostingConfig, resolve(outputDirectory, "hosting.json"));
      if (await exists(drizzleSource)) {
        await cp(drizzleSource, resolve(outputDirectory, "drizzle"), {
          recursive: true,
        });
      }
    },
  };
}
