import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { ScaffoldOptions, ResolvedPaths } from "../../types.js";
import { toPascal } from "./utils.js";

export function injectFunction(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, operation, fields, dryRun } = options;

  if (!operation) return;

  const outPath = path.join(paths.functionsDir, `${name}.js`);

  if (existsSync(outPath)) {
    console.log(
      chalk.yellow(
        `  [skip] Function file already exists: functions/${name}.js`,
      ),
    );
    return;
  }

  const templatePath = path.join(
    paths.templatesDir,
    "graphql",
    "functions",
    `${operation}.js.tpl`,
  );
  if (!existsSync(templatePath)) {
    console.error(
      chalk.red(`  [error] Template not found: ${operation}.js.tpl`),
    );
    process.exit(1);
  }

  let content = readFileSync(templatePath, "utf-8");

  if (operation === "Query" && fields.length > 0) {
    const field = fields[0];
    const index = `by${toPascal(field)}`;
    content = content.replace(/\{\{FIELD\}\}/g, field);
    content = content.replace(/\{\{INDEX\}\}/g, index);
  }

  if (operation === "GetItem" && fields.length > 0) {
    const field = fields[0];
    content = content.replace(/\{\{FIELD\}\}/g, field);
  }

  if (dryRun) {
    console.log(chalk.cyan(`  [dry-run] Would create functions/${name}.js:`));
    console.log(chalk.gray(content));
  } else {
    writeFileSync(outPath, content);
    console.log(
      chalk.green(`  [created] functions/${name}.js (${operation} template)`),
    );
  }
}
