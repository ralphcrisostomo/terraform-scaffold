import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { ScaffoldOptions, ResolvedPaths } from "../../types.js";
import { lcfirst, toPascal, toScreamingSnake } from "./utils.js";

function deleteSchemaField(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, dryRun } = options;
  const schema = readFileSync(paths.schemaPath, "utf-8");

  const fieldRegex = new RegExp(
    `^\\s+${name}\\([^)]*\\):\\s*\\[?\\w+\\]?\\s*\\n`,
    "m",
  );

  if (!fieldRegex.test(schema)) {
    console.log(chalk.yellow(`  [skip] Schema field "${name}" not found`));
    return;
  }

  const updated = schema.replace(fieldRegex, "");

  if (dryRun) {
    console.log(chalk.cyan(`  [dry-run] Would remove schema field "${name}"`));
  } else {
    writeFileSync(paths.schemaPath, updated);
    console.log(chalk.green(`  [deleted] Schema field "${name}"`));
  }
}

function deleteGraphqlConstant(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, model, dryRun } = options;
  const constName = toScreamingSnake(name);
  const fileName = lcfirst(model) + ".ts";
  const filePath = path.join(paths.graphqlDir, fileName);

  if (!existsSync(filePath)) {
    console.log(chalk.yellow(`  [skip] GraphQL file not found: ${fileName}`));
    return;
  }

  const content = readFileSync(filePath, "utf-8");

  const constRegex = new RegExp(
    `\\nexport const ${constName} = \`[\\s\\S]*?\`\\n`,
    "",
  );

  if (!constRegex.test(content)) {
    console.log(
      chalk.yellow(
        `  [skip] GraphQL constant "${constName}" not found in ${fileName}`,
      ),
    );
    return;
  }

  const updated = content.replace(constRegex, "\n");

  if (dryRun) {
    console.log(
      chalk.cyan(
        `  [dry-run] Would remove constant "${constName}" from ${fileName}`,
      ),
    );
  } else {
    if (updated.trim() === "") {
      rmSync(filePath);
      console.log(chalk.green(`  [deleted] ${fileName} (empty after removal)`));
    } else {
      writeFileSync(filePath, updated);
      console.log(
        chalk.green(
          `  [deleted] GraphQL constant "${constName}" from ${fileName}`,
        ),
      );
    }
  }
}

function deleteTerraformBlocks(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, model, runtime, dryRun } = options;
  const modelLower = lcfirst(model);
  const fileName = `${modelLower}.tf`;
  const filePath = path.join(paths.tfStagingDir, fileName);

  if (!existsSync(filePath)) {
    console.log(chalk.yellow(`  [skip] TF file not found: ${fileName}`));
    return;
  }

  let content = readFileSync(filePath, "utf-8");
  let removed = false;

  if (runtime === "LAMBDA") {
    const markerRegex = new RegExp(
      `\\n# Note: ${name} START[\\s\\S]*?# Note: ${name} END\\n`,
      "",
    );
    if (markerRegex.test(content)) {
      content = content.replace(markerRegex, "\n");
      removed = true;
    }

    const pipelineRegex = new RegExp(
      `\\nmodule "appsync_pipeline_resolver_${name}"\\s*\\{[^}]*\\}\\n`,
      "",
    );
    if (pipelineRegex.test(content)) {
      content = content.replace(pipelineRegex, "\n");
      removed = true;
    }
  } else {
    const functionRegex = new RegExp(
      `\\nmodule "appsync_function_${name}"\\s*\\{[^}]*\\}\\n`,
      "",
    );
    const pipelineRegex = new RegExp(
      `\\nmodule "appsync_pipeline_resolver_${name}"\\s*\\{[^}]*\\}\\n`,
      "",
    );

    if (functionRegex.test(content)) {
      content = content.replace(functionRegex, "\n");
      removed = true;
    }
    if (pipelineRegex.test(content)) {
      content = content.replace(pipelineRegex, "\n");
      removed = true;
    }
  }

  if (!removed) {
    console.log(
      chalk.yellow(
        `  [skip] TF modules for "${name}" not found in ${fileName}`,
      ),
    );
    return;
  }

  if (dryRun) {
    console.log(
      chalk.cyan(
        `  [dry-run] Would remove TF modules for "${name}" from ${fileName}`,
      ),
    );
  } else {
    writeFileSync(filePath, content);
    console.log(
      chalk.green(`  [deleted] TF modules for "${name}" from ${fileName}`),
    );
  }
}

function deleteFunctionFile(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, dryRun } = options;
  const filePath = path.join(paths.functionsDir, `${name}.js`);

  if (!existsSync(filePath)) {
    console.log(
      chalk.yellow(`  [skip] Function file not found: functions/${name}.js`),
    );
    return;
  }

  if (dryRun) {
    console.log(chalk.cyan(`  [dry-run] Would delete functions/${name}.js`));
  } else {
    rmSync(filePath);
    console.log(chalk.green(`  [deleted] functions/${name}.js`));
  }
}

function deleteLambdaSource(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, dryRun } = options;
  const pascalName = toPascal(name);
  const fullName = `${paths.functionPrefix}${pascalName}`;
  const srcDir = path.join(paths.lambdaSrc, fullName);

  if (!existsSync(srcDir)) {
    console.log(
      chalk.yellow(
        `  [skip] Lambda source not found: terraform/lambda/src/${fullName}/`,
      ),
    );
    return;
  }

  if (dryRun) {
    console.log(
      chalk.cyan(`  [dry-run] Would delete terraform/lambda/src/${fullName}/`),
    );
  } else {
    rmSync(srcDir, { recursive: true });
    console.log(chalk.green(`  [deleted] terraform/lambda/src/${fullName}/`));
  }
}

export function deleteArtifacts(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  deleteSchemaField(options, paths);
  deleteGraphqlConstant(options, paths);
  deleteTerraformBlocks(options, paths);

  if (options.runtime === "APPSYNC_JS") {
    deleteFunctionFile(options, paths);
  } else {
    deleteLambdaSource(options, paths);
  }

  console.log(
    chalk.yellow(
      "\n  Note: Composable function deletion is not automated. Remove manually if needed.",
    ),
  );
}
