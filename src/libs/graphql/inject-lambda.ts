import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { ScaffoldOptions, ResolvedPaths } from "../../types.js";
import { toPascal } from "./utils.js";

export function injectLambda(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, dryRun } = options;
  const pascalName = toPascal(name);
  const fullName = `${paths.functionPrefix}${pascalName}`;
  const srcDir = path.join(paths.lambdaSrc, fullName);

  if (existsSync(srcDir)) {
    console.log(
      chalk.yellow(
        `  [skip] Lambda source already exists: terraform/lambda/src/${fullName}/`,
      ),
    );
    return;
  }

  const lambdaTemplatesDir = path.join(paths.templatesDir, "lambda");
  const indexTemplate = readFileSync(
    path.join(lambdaTemplatesDir, "index.ts.tpl"),
    "utf-8",
  );
  const agentsTemplate = readFileSync(
    path.join(lambdaTemplatesDir, "AGENTS.md.tpl"),
    "utf-8",
  );
  const geminiTemplate = readFileSync(
    path.join(lambdaTemplatesDir, "GEMINI.md.tpl"),
    "utf-8",
  );

  const indexContent = indexTemplate.replace(/\{\{FULL_NAME\}\}/g, fullName);
  const agentsContent = agentsTemplate.replace(
    /\{\{DESCRIPTION\}\}/g,
    `TODO: describe ${pascalName} lambda purpose.`,
  );
  const packageJson =
    JSON.stringify({ version: "0.0.1", lastBuildAt: "" }, null, 2) + "\n";

  if (dryRun) {
    console.log(chalk.cyan("  [dry-run] Would create lambda source files:"));
    console.log(chalk.gray(`    ${fullName}/index.ts`));
    console.log(chalk.gray(`    ${fullName}/package.json`));
    console.log(chalk.gray(`    ${fullName}/AGENTS.md`));
    console.log(chalk.gray(`    ${fullName}/GEMINI.md`));
  } else {
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(path.join(srcDir, "index.ts"), indexContent);
    writeFileSync(path.join(srcDir, "package.json"), packageJson);
    writeFileSync(path.join(srcDir, "AGENTS.md"), agentsContent);
    writeFileSync(path.join(srcDir, "GEMINI.md"), geminiTemplate);
    console.log(
      chalk.green(`  [created] terraform/lambda/src/${fullName}/ (4 files)`),
    );
  }
}
