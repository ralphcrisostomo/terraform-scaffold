import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
} from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { input } from "@inquirer/prompts";
import { fileURLToPath } from "node:url";
import type { ResolvedPaths } from "../types.js";

interface InitValues {
  projectName: string;
  projectKebab: string;
  functionPrefix: string;
  awsRegion: string;
  stateBucket: string;
  lockTable: string;
}

function toKebab(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function applyPlaceholders(content: string, values: InitValues): string {
  return content
    .replace(/\{\{PROJECT_NAME\}\}/g, values.projectName)
    .replace(/\{\{PROJECT_KEBAB\}\}/g, values.projectKebab)
    .replace(/\{\{FUNCTION_PREFIX\}\}/g, values.functionPrefix)
    .replace(/\{\{AWS_REGION\}\}/g, values.awsRegion)
    .replace(/\{\{STATE_BUCKET\}\}/g, values.stateBucket)
    .replace(/\{\{LOCK_TABLE\}\}/g, values.lockTable);
}

function copyDirWithPlaceholders(
  srcDir: string,
  destDir: string,
  values: InitValues,
  dryRun: boolean,
  createdFiles: string[],
): void {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destName = entry.name.replace(/\.tpl$/, "");
    const destPath = path.join(destDir, destName);

    if (entry.isDirectory()) {
      if (!dryRun) {
        mkdirSync(destPath, { recursive: true });
      }
      copyDirWithPlaceholders(srcPath, destPath, values, dryRun, createdFiles);
    } else {
      const relPath = path.relative(process.cwd(), destPath);
      if (existsSync(destPath)) {
        console.log(chalk.yellow(`  [skip] ${relPath} (already exists)`));
        continue;
      }

      if (entry.name.endsWith(".tpl")) {
        const content = readFileSync(srcPath, "utf-8");
        const processed = applyPlaceholders(content, values);
        if (!dryRun) {
          writeFileSync(destPath, processed);
        }
      } else {
        // Static file — copy as-is
        if (!dryRun) {
          copyFileSync(srcPath, destPath);
        }
      }
      createdFiles.push(relPath);
    }
  }
}

function getInitTemplatesDir(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // In dist/, go up to package root, then into src/templates/init
  return path.resolve(__dirname, "..", "src", "templates", "init");
}

export async function runInit(argv: string[]): Promise<void> {
  const dryRun = argv.includes("--dry-run");
  const cwd = process.cwd();

  // Check if config already exists
  const configPath = path.join(cwd, "terraform-scaffold.config.ts");
  if (existsSync(configPath)) {
    console.error(
      chalk.red(
        "terraform-scaffold.config.ts already exists. Remove it first to re-initialize.",
      ),
    );
    process.exit(1);
  }

  console.log(chalk.bold("\nTerraform Scaffold — Initialize Project\n"));

  // Gather values via prompts
  const projectName = await input({
    message: "Project name (e.g., my-app):",
    validate: (v) => v.trim().length > 0 || "Project name is required",
  });

  const functionPrefix = await input({
    message: "Function prefix in PascalCase (e.g., MyAppName):",
    validate: (v) =>
      /^[A-Z][a-zA-Z0-9]*$/.test(v) ||
      "Must be PascalCase (start with uppercase letter, alphanumeric only)",
  });

  const awsRegion = await input({
    message: "AWS region:",
    default: "ap-southeast-2",
  });

  const stateBucket = await input({
    message: "S3 state bucket name:",
    validate: (v) => v.trim().length > 0 || "State bucket name is required",
  });

  const lockTable = await input({
    message: "DynamoDB lock table name:",
    validate: (v) => v.trim().length > 0 || "Lock table name is required",
  });

  const values: InitValues = {
    projectName,
    projectKebab: toKebab(projectName),
    functionPrefix,
    awsRegion,
    stateBucket,
    lockTable,
  };

  console.log(chalk.bold("\n  Configuration:\n"));
  console.log(chalk.gray(`  Project:     ${values.projectName}`));
  console.log(chalk.gray(`  Kebab:       ${values.projectKebab}`));
  console.log(chalk.gray(`  Prefix:      ${values.functionPrefix}`));
  console.log(chalk.gray(`  Region:      ${values.awsRegion}`));
  console.log(chalk.gray(`  State bucket: ${values.stateBucket}`));
  console.log(chalk.gray(`  Lock table:  ${values.lockTable}`));

  if (dryRun) {
    console.log(chalk.cyan("\n  Mode: DRY RUN\n"));
  } else {
    console.log("");
  }

  const initTemplatesDir = getInitTemplatesDir();
  if (!existsSync(initTemplatesDir)) {
    console.error(
      chalk.red(
        "Init templates directory not found. This may be a packaging issue.",
      ),
    );
    process.exit(1);
  }

  const createdFiles: string[] = [];

  // 1. Create config file
  const configTemplatePath = path.join(
    initTemplatesDir,
    "terraform-scaffold.config.ts.tpl",
  );
  const configContent = applyPlaceholders(
    readFileSync(configTemplatePath, "utf-8"),
    values,
  );
  if (!dryRun) {
    writeFileSync(configPath, configContent);
  }
  createdFiles.push("terraform-scaffold.config.ts");

  // 2. Create terraform/envs/ structure
  const envsTemplateDir = path.join(initTemplatesDir, "envs");
  const envsTargetDir = path.join(cwd, "terraform", "envs");
  if (!dryRun) {
    mkdirSync(envsTargetDir, { recursive: true });
  }
  copyDirWithPlaceholders(
    envsTemplateDir,
    envsTargetDir,
    values,
    dryRun,
    createdFiles,
  );

  // 3. Copy schema.graphql to staging env
  const schemaTemplatePath = path.join(initTemplatesDir, "schema.graphql.tpl");
  const schemaTargetPath = path.join(
    cwd,
    "terraform",
    "envs",
    "staging",
    "schema.graphql",
  );
  if (!existsSync(schemaTargetPath)) {
    const schemaContent = applyPlaceholders(
      readFileSync(schemaTemplatePath, "utf-8"),
      values,
    );
    if (!dryRun) {
      writeFileSync(schemaTargetPath, schemaContent);
    }
    createdFiles.push("terraform/envs/staging/schema.graphql");
  } else {
    console.log(
      chalk.yellow(
        "  [skip] terraform/envs/staging/schema.graphql (already exists)",
      ),
    );
  }

  // 4. Create terraform/functions/ with base resolvers
  const functionsTemplateDir = path.join(initTemplatesDir, "functions");
  const functionsTargetDir = path.join(cwd, "terraform", "functions");
  if (!dryRun) {
    mkdirSync(functionsTargetDir, { recursive: true });
  }
  copyDirWithPlaceholders(
    functionsTemplateDir,
    functionsTargetDir,
    values,
    dryRun,
    createdFiles,
  );

  // 5. Create terraform/lambda/ structure
  const lambdaTemplateDir = path.join(initTemplatesDir, "lambda");
  const lambdaTargetDir = path.join(cwd, "terraform", "lambda");
  if (!dryRun) {
    mkdirSync(path.join(lambdaTargetDir, "src"), { recursive: true });
    mkdirSync(path.join(lambdaTargetDir, "dist"), { recursive: true });
  }
  copyDirWithPlaceholders(
    lambdaTemplateDir,
    lambdaTargetDir,
    values,
    dryRun,
    createdFiles,
  );

  // 6. Copy services/ templates
  const servicesTemplateDir = path.join(initTemplatesDir, "services");
  const servicesTargetDir = path.join(cwd, "services");
  if (!dryRun) {
    mkdirSync(servicesTargetDir, { recursive: true });
  }
  copyDirWithPlaceholders(
    servicesTemplateDir,
    servicesTargetDir,
    values,
    dryRun,
    createdFiles,
  );

  // 7. Copy composables/ templates
  const composablesTemplateDir = path.join(initTemplatesDir, "composables");
  const composablesTargetDir = path.join(cwd, "app", "composables");
  if (!dryRun) {
    mkdirSync(composablesTargetDir, { recursive: true });
  }
  copyDirWithPlaceholders(
    composablesTemplateDir,
    composablesTargetDir,
    values,
    dryRun,
    createdFiles,
  );

  // 8. Copy utils/ templates
  const utilsTemplateDir = path.join(initTemplatesDir, "utils");
  const utilsTargetDir = path.join(cwd, "utils");
  if (!dryRun) {
    mkdirSync(utilsTargetDir, { recursive: true });
  }
  copyDirWithPlaceholders(
    utilsTemplateDir,
    utilsTargetDir,
    values,
    dryRun,
    createdFiles,
  );

  // 9. Copy terraform modules via sync-modules logic
  const modulesTargetDir = path.join(cwd, "terraform", "modules");
  const modulesSourceDir = path.resolve(
    initTemplatesDir,
    "..",
    "..",
    "terraform-modules",
  );
  if (existsSync(modulesSourceDir)) {
    const moduleEntries = readdirSync(modulesSourceDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    if (moduleEntries.length > 0) {
      if (!dryRun) {
        mkdirSync(modulesTargetDir, { recursive: true });
        for (const mod of moduleEntries) {
          copyDirRecursive(
            path.join(modulesSourceDir, mod),
            path.join(modulesTargetDir, mod),
          );
        }
      }
      createdFiles.push(`terraform/modules/ (${moduleEntries.length} modules)`);
    }
  }

  // 10. Inject convenience scripts into package.json
  const pkgJsonPath = path.join(cwd, "package.json");
  if (existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    const scripts: Record<string, string> = pkgJson.scripts ?? {};
    const environments = ["staging", "production"];
    const newScripts: Record<string, string> = {
      "gen:graphql": "terraform-scaffold graphql",
      "gen:lambda": "terraform-scaffold lambda",
    };
    for (const env of environments) {
      newScripts[`tf:init:${env}`] = `terraform-scaffold tf ${env} init`;
      newScripts[`tf:plan:${env}`] = `terraform-scaffold tf ${env} plan`;
      newScripts[`tf:apply:${env}`] =
        `terraform-scaffold build --env=${env} && terraform-scaffold tf ${env} apply`;
      newScripts[`tf:build:${env}`] = `terraform-scaffold build --env=${env}`;
      newScripts[`tf:output:${env}`] = `terraform-scaffold tf-output ${env}`;
    }
    newScripts["tf:sync-modules"] = "terraform-scaffold sync-modules";

    const addedScripts: string[] = [];
    for (const [key, value] of Object.entries(newScripts)) {
      if (!scripts[key]) {
        scripts[key] = value;
        addedScripts.push(key);
      }
    }

    if (addedScripts.length > 0) {
      pkgJson.scripts = scripts;
      if (!dryRun) {
        writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
      }
      createdFiles.push(`package.json scripts (${addedScripts.length} added)`);
    }
  }

  // Summary
  console.log(chalk.bold("\n  Created files:\n"));
  for (const file of createdFiles) {
    console.log(chalk.green(`  + ${file}`));
  }

  if (!dryRun) {
    console.log(chalk.bold("\n  Next steps:\n"));
    console.log(
      chalk.gray(
        `  1. Copy terraform/envs/staging/terraform.tfvars.example to terraform.tfvars and fill in values`,
      ),
    );
    console.log(chalk.gray(`  2. Run: bun run tf:init:staging`));
    console.log(
      chalk.gray(
        `  3. Start scaffolding: bun run gen:graphql or bun run gen:lambda`,
      ),
    );
  }

  console.log("");
}

function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
