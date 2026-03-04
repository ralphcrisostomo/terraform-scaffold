import { readFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";
import type { ScaffoldOptions, ResolvedPaths } from "../../types.js";
import { LIST_OPERATIONS } from "../../types.js";
import { extractModelFields } from "./schema-parser.js";

function buildSchemaField(
  options: ScaffoldOptions,
  schemaPath: string,
  excludedModels: string[],
): string {
  const { name, model, fields, operation } = options;

  const modelFields = extractModelFields(model, schemaPath, excludedModels);
  const args = fields
    .map((f) => {
      const modelField = modelFields.find((mf) => mf.name === f);
      if (modelField) {
        return `${f}: ${modelField.type}`;
      }
      const extraMap: Record<string, string> = {
        payload: "AWSJSON",
        filter: "AWSJSON",
        limit: "Int",
        nextToken: "String",
      };
      return `${f}: ${extraMap[f] || "String"}`;
    })
    .join(", ");

  const isList = operation ? LIST_OPERATIONS.includes(operation) : false;
  const returnType = isList ? `[${model}]` : model;

  return `    ${name}(${args}): ${returnType}`;
}

export function injectSchema(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
  excludedModels: string[],
): void {
  const { name, type, dryRun } = options;
  const schema = readFileSync(paths.schemaPath, "utf-8");

  const fieldRegex = new RegExp(`^\\s+${name}\\(`, "m");
  if (fieldRegex.test(schema)) {
    console.log(chalk.yellow(`  [skip] Schema field "${name}" already exists`));
    return;
  }

  const fieldLine = buildSchemaField(options, paths.schemaPath, excludedModels);
  const blockName = type === "query" ? "Query" : "Mutation";
  const blockRegex = new RegExp(`(type\\s+${blockName}\\s*\\{[^}]*)(\\})`);

  const match = schema.match(blockRegex);
  if (!match) {
    console.error(
      chalk.red(`Could not find "type ${blockName}" block in schema`),
    );
    process.exit(1);
  }

  const updated = schema.replace(blockRegex, `$1${fieldLine}\n$2`);

  if (dryRun) {
    console.log(
      chalk.cyan(`  [dry-run] Would inject into schema type ${blockName}:`),
    );
    console.log(chalk.gray(`    ${fieldLine.trim()}`));
  } else {
    writeFileSync(paths.schemaPath, updated);
    console.log(
      chalk.green(`  [created] Schema field "${name}" in type ${blockName}`),
    );
  }
}
