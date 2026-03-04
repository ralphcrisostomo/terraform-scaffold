import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  copyFileSync,
} from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import chalk from "chalk";
import type { TerraformScaffoldConfig, ResolvedPaths } from "../types.js";

interface ModuleManifest {
  version: string;
  checksums: Record<string, string>;
}

function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

function collectFiles(dir: string, base = ""): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...collectFiles(path.join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files.sort();
}

function buildChecksums(dir: string): Record<string, string> {
  const files = collectFiles(dir);
  const checksums: Record<string, string> = {};
  for (const file of files) {
    checksums[file] = hashFile(path.join(dir, file));
  }
  return checksums;
}

function readManifest(targetDir: string): ModuleManifest | null {
  const manifestPath = path.join(targetDir, ".terraform-scaffold-version");
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8")) as ModuleManifest;
  } catch {
    return null;
  }
}

function writeManifest(
  targetDir: string,
  version: string,
  checksums: Record<string, string>,
): void {
  const manifestPath = path.join(targetDir, ".terraform-scaffold-version");
  const manifest: ModuleManifest = { version, checksums };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function getPackageVersion(): string {
  try {
    const pkgPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "..",
      "..",
      "package.json",
    );
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export async function runSyncModules(
  argv: string[],
  _config: TerraformScaffoldConfig,
  paths: ResolvedPaths,
): Promise<void> {
  const checkOnly = argv.includes("--check");
  const force = argv.includes("--force");

  const sourceDir = paths.terraformModulesDir;
  const targetDir = path.join(paths.projectRoot, "terraform/modules");
  const version = getPackageVersion();

  if (!existsSync(sourceDir)) {
    console.error(
      chalk.red(
        "Package terraform-modules directory not found. This may be a packaging issue.",
      ),
    );
    process.exit(1);
  }

  const sourceModules = readdirSync(sourceDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  if (sourceModules.length === 0) {
    console.error(chalk.red("No terraform modules found in package."));
    process.exit(1);
  }

  console.log(
    chalk.bold(
      `\nSync Terraform Modules (v${version}) — ${sourceModules.length} modules\n`,
    ),
  );

  // Build checksums for package source
  const sourceChecksums = buildChecksums(sourceDir);

  // Check existing manifest
  const manifest = readManifest(targetDir);

  if (!existsSync(targetDir)) {
    if (checkOnly) {
      console.log(
        chalk.yellow("Target directory does not exist. Modules need syncing."),
      );
      process.exit(1);
    }

    // Fresh copy
    console.log(chalk.blue("  No existing modules found. Copying all..."));
    copyDir(sourceDir, targetDir);
    writeManifest(targetDir, version, sourceChecksums);
    console.log(
      chalk.green(
        `  Copied ${sourceModules.length} modules to terraform/modules/`,
      ),
    );
    console.log("");
    return;
  }

  // Compare checksums to detect drift
  const targetChecksums = buildChecksums(targetDir);
  const locallyModified: string[] = [];
  const needsUpdate: string[] = [];
  const newFiles: string[] = [];

  for (const [file, sourceHash] of Object.entries(sourceChecksums)) {
    const targetHash = targetChecksums[file];
    if (!targetHash) {
      newFiles.push(file);
    } else if (targetHash !== sourceHash) {
      // Check if this was locally modified (differs from last synced version)
      if (
        manifest?.checksums[file] &&
        manifest.checksums[file] !== targetHash
      ) {
        locallyModified.push(file);
      } else {
        needsUpdate.push(file);
      }
    }
  }

  const upToDate =
    locallyModified.length === 0 &&
    needsUpdate.length === 0 &&
    newFiles.length === 0;

  if (upToDate) {
    console.log(chalk.green("  All modules are up to date."));
    console.log("");
    return;
  }

  if (checkOnly) {
    if (newFiles.length > 0) {
      console.log(chalk.blue(`  New files: ${newFiles.length}`));
      for (const f of newFiles) {
        console.log(chalk.gray(`    + ${f}`));
      }
    }
    if (needsUpdate.length > 0) {
      console.log(chalk.yellow(`  Needs update: ${needsUpdate.length}`));
      for (const f of needsUpdate) {
        console.log(chalk.gray(`    ~ ${f}`));
      }
    }
    if (locallyModified.length > 0) {
      console.log(chalk.red(`  Locally modified: ${locallyModified.length}`));
      for (const f of locallyModified) {
        console.log(chalk.gray(`    ! ${f}`));
      }
    }
    console.log("");
    process.exit(1);
  }

  if (locallyModified.length > 0 && !force) {
    console.log(
      chalk.yellow(
        `  ${locallyModified.length} file(s) have local modifications:`,
      ),
    );
    for (const f of locallyModified) {
      console.log(chalk.gray(`    ! ${f}`));
    }
    console.log(
      chalk.yellow(
        "\n  Use --force to overwrite local modifications, or manually resolve differences.",
      ),
    );
    process.exit(1);
  }

  // Perform the sync
  let copied = 0;
  for (const file of [...newFiles, ...needsUpdate]) {
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(targetDir, file);
    mkdirSync(path.dirname(destPath), { recursive: true });
    copyFileSync(srcPath, destPath);
    copied++;
  }

  if (force && locallyModified.length > 0) {
    for (const file of locallyModified) {
      const srcPath = path.join(sourceDir, file);
      const destPath = path.join(targetDir, file);
      mkdirSync(path.dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
      copied++;
    }
    console.log(
      chalk.yellow(
        `  Overwrote ${locallyModified.length} locally modified file(s)`,
      ),
    );
  }

  // Rebuild checksums after sync and write manifest
  const finalChecksums = buildChecksums(targetDir);
  writeManifest(targetDir, version, finalChecksums);

  if (newFiles.length > 0) {
    console.log(chalk.green(`  Added ${newFiles.length} new file(s)`));
  }
  if (needsUpdate.length > 0) {
    console.log(chalk.green(`  Updated ${needsUpdate.length} file(s)`));
  }
  console.log(chalk.green(`  Synced ${copied} file(s) total (v${version})`));
  console.log("");
}
