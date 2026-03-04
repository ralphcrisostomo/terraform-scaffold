import { readdirSync, mkdirSync, createWriteStream, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { build } from "esbuild";
import archiver from "archiver";
import type { TerraformScaffoldConfig, ResolvedPaths } from "../types.js";

type Environment = "staging" | "production";

type BuildOptions = {
  env: Environment;
  functionName?: string;
};

function parseArgs(argv: string[]): BuildOptions {
  const envArg = argv.find((arg) => arg.startsWith("--env="));
  const fnArg = argv.find((arg) => arg.startsWith("--function="));

  if (!envArg) {
    console.error(
      chalk.red(
        "Missing required --env flag.\n" +
          "Usage: terraform-scaffold build --env=staging|production [--function=FunctionName]",
      ),
    );
    process.exit(1);
  }

  const env = envArg.split("=")[1] as string;
  if (env !== "staging" && env !== "production") {
    console.error(
      chalk.red(
        `Invalid environment: ${env}. Must be "staging" or "production".`,
      ),
    );
    process.exit(1);
  }

  const functionName = fnArg ? (fnArg.split("=")[1] as string) : undefined;

  return { env, functionName };
}

function discoverFunctions(
  lambdaSrc: string,
  functionPrefix: string,
): string[] {
  const entries = readdirSync(lambdaSrc, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith(functionPrefix))
    .map((e) => e.name)
    .sort();
}

function getZipName(
  functionName: string,
  env: Environment,
  functionPrefix: string,
): string {
  const suffix = functionName.replace(functionPrefix, "");
  const envPrefix = env === "staging" ? "Staging" : "Production";
  return `${functionPrefix}${envPrefix}${suffix}.zip`;
}

async function bundleFunction(
  functionName: string,
  paths: ResolvedPaths,
  config: TerraformScaffoldConfig,
): Promise<string> {
  const entryFile = path.join(paths.lambdaSrc, functionName, "index.ts");
  if (!existsSync(entryFile)) {
    throw new Error(`Entry file not found: ${entryFile}`);
  }

  const tmpDir = path.join(paths.projectRoot, ".tmp/lambda-build");
  const outDir = path.join(tmpDir, functionName);
  mkdirSync(outDir, { recursive: true });

  const outfile = path.join(outDir, "index.js");

  // Resolve aliases relative to project root
  const resolvedAliases: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.lambdaBuild.aliases)) {
    resolvedAliases[key] =
      value === "."
        ? paths.projectRoot
        : path.join(paths.projectRoot, value.replace(/^\.\//, ""));
  }

  await build({
    entryPoints: [entryFile],
    bundle: true,
    minify: false,
    sourcemap: false,
    platform: "node",
    target: config.lambdaBuild.target,
    supported: { bigint: true },
    outfile,
    external: config.lambdaBuild.external,
    define: { "process.env.NODE_ENV": '"production"' },
    format: "cjs",
    logLevel: "warning",
    alias: resolvedAliases,
  });

  return outfile;
}

function formatBuildTimestamp(): string {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

async function zipFunction(bundlePath: string, zipPath: string): Promise<void> {
  mkdirSync(path.dirname(zipPath), { recursive: true });

  const packageJson = JSON.stringify(
    { version: "0.0.1", lastBuildAt: formatBuildTimestamp() },
    null,
    2,
  );
  const packageJsonPath = path.join(path.dirname(bundlePath), "package.json");
  await writeFile(packageJsonPath, packageJson + "\n");

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.file(bundlePath, { name: "index.js" });
    archive.file(packageJsonPath, { name: "package.json" });
    archive.finalize();
  });
}

async function buildFunction(
  functionName: string,
  env: Environment,
  paths: ResolvedPaths,
  config: TerraformScaffoldConfig,
): Promise<void> {
  const zipName = getZipName(functionName, env, config.functionPrefix);
  console.log(chalk.blue(`  [build] ${functionName} → ${zipName}`));

  const bundlePath = await bundleFunction(functionName, paths, config);
  const zipPath = path.join(paths.lambdaDist, zipName);
  await zipFunction(bundlePath, zipPath);

  console.log(chalk.green(`  [done]  ${zipName}`));
}

export async function runLambdaBuild(
  argv: string[],
  config: TerraformScaffoldConfig,
  paths: ResolvedPaths,
): Promise<void> {
  const options = parseArgs(argv);
  const envLabel = options.env === "staging" ? "Staging" : "Production";

  console.log(chalk.bold(`\nLambda Build — ${envLabel}\n`));

  const allFunctions = discoverFunctions(
    paths.lambdaSrc,
    config.functionPrefix,
  );

  let targets: string[];
  if (options.functionName) {
    if (!allFunctions.includes(options.functionName)) {
      console.error(
        chalk.red(
          `Function "${options.functionName}" not found. Available:\n` +
            allFunctions.map((f) => `  - ${f}`).join("\n"),
        ),
      );
      process.exit(1);
    }
    targets = [options.functionName];
  } else {
    targets = allFunctions;
  }

  console.log(chalk.gray(`Building ${targets.length} function(s)...\n`));

  const results = await Promise.allSettled(
    targets.map((fn) => buildFunction(fn, options.env, paths, config)),
  );

  const failed = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );

  console.log("");
  if (failed.length > 0) {
    console.error(chalk.red(`${failed.length} function(s) failed to build:`));
    failed.forEach((r) => console.error(chalk.red(`  ${r.reason}`)));
    process.exit(1);
  }

  console.log(
    chalk.green.bold(`All ${targets.length} function(s) built successfully.`),
  );
}
