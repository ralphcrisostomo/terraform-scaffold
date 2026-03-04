import { promises as fs } from "fs";
import * as path from "path";
import { spawnSync } from "node:child_process";
import chalk from "chalk";
import type { TerraformScaffoldConfig } from "../types.js";

type EnvMap = Record<string, string>;

function parseEnv(content: string): EnvMap {
  const out: EnvMap = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) out[key] = value;
  }
  return out;
}

function needsQuoteEnv(v: string): boolean {
  return /\s|#|["']/.test(v);
}

function dotenvStringify(map: EnvMap): string {
  const sorted = Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => a.localeCompare(b)),
  );
  const lines: string[] = [];
  for (const [k, v] of Object.entries(sorted)) {
    if (needsQuoteEnv(v)) {
      const escaped = v.replace(/"/g, '\\"');
      lines.push(`${k}="${escaped}"`);
    } else {
      lines.push(`${k}=${v}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function usage(): string {
  return "Usage: terraform-scaffold tf-output <environment>\n  environment: staging | production";
}

export async function runTerraformOutput(
  argv: string[],
  config: TerraformScaffoldConfig,
): Promise<void> {
  const [envArg] = argv;

  if (!envArg || !config.environments.includes(envArg)) {
    console.error(
      chalk.red(
        envArg
          ? `Invalid environment: ${envArg}`
          : "Missing environment argument",
      ),
    );
    console.error(usage());
    process.exit(1);
  }

  const environment = envArg;
  const envDir = `${config.paths.terraformEnvs}/${environment}`;
  const outFile = `.env.${environment}`;
  const cwd = process.cwd();

  console.log(chalk.blue(`Running terraform output for ${environment}...`));

  const result = spawnSync(
    "terraform",
    ["-chdir=" + envDir, "output", "-json", "config"],
    { env: process.env, encoding: "utf8" },
  );

  if (result.error) {
    console.error(
      chalk.red(`Failed to execute terraform: ${result.error.message}`),
    );
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.error(chalk.red(`terraform output failed (exit ${result.status})`));
    if (result.stderr) console.error(result.stderr);
    process.exit(result.status);
  }

  let tfValues: EnvMap;
  try {
    const parsed = JSON.parse(result.stdout);
    const raw = parsed.value ?? parsed;

    tfValues = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      tfValues[k] = String(v);
    }
  } catch (err) {
    console.error(
      chalk.red(
        `Failed to parse terraform output: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
    process.exit(1);
  }

  const tfKeys = Object.keys(tfValues).sort();
  if (tfKeys.length === 0) {
    console.warn(chalk.yellow("Terraform output contained no keys."));
    process.exit(0);
  }

  const outPath = path.join(cwd, outFile);
  let existing: EnvMap = {};
  try {
    const content = await fs.readFile(outPath, "utf8");
    existing = parseEnv(content);
  } catch {
    // file doesn't exist yet
  }

  const added: string[] = [];
  const updated: string[] = [];
  for (const key of tfKeys) {
    if (!(key in existing)) {
      added.push(key);
    } else if (existing[key] !== tfValues[key]) {
      updated.push(key);
    }
  }

  const merged: EnvMap = { ...existing, ...tfValues };

  await fs.writeFile(outPath, dotenvStringify(merged), "utf8");

  if (environment === "staging") {
    const dotEnvPath = path.join(cwd, ".env");
    let dotEnvExisting: EnvMap = {};
    try {
      dotEnvExisting = parseEnv(await fs.readFile(dotEnvPath, "utf8"));
    } catch {
      // file may not exist
    }

    const dotEnvMerged = { ...dotEnvExisting, ...tfValues };
    await fs.writeFile(dotEnvPath, dotenvStringify(dotEnvMerged), "utf8");
    console.log(
      chalk.green(
        `Also updated .env (${Object.keys(dotEnvMerged).length} keys)`,
      ),
    );
  }

  console.log(
    chalk.green(`Wrote ${outFile} (${Object.keys(merged).length} keys total)`),
  );
  if (added.length > 0) {
    console.log(chalk.green(`  Added: ${added.join(", ")}`));
  }
  if (updated.length > 0) {
    console.log(chalk.yellow(`  Updated: ${updated.join(", ")}`));
  }
  const unchanged = tfKeys.length - added.length - updated.length;
  if (unchanged > 0) {
    console.log(chalk.gray(`  Unchanged: ${unchanged} key(s)`));
  }
}
