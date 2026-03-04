import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { ScaffoldOptions, ResolvedPaths } from "../../types.js";
import { extractModelFields } from "./schema-parser.js";
import { lcfirst, toScreamingSnake, toPascal } from "./utils.js";

function buildGraphqlConstant(
  options: ScaffoldOptions,
  schemaPath: string,
  excludedModels: string[],
): string {
  const { name, model, type, fields } = options;
  const constName = toScreamingSnake(name);
  const operationType = type === "query" ? "query" : "mutation";
  const pascalName = toPascal(name);

  const modelFields = extractModelFields(model, schemaPath, excludedModels);
  const varDeclarations = fields
    .map((f) => {
      const modelField = modelFields.find((mf) => mf.name === f);
      const gqlType = modelField
        ? modelField.type
        : {
            payload: "AWSJSON",
            filter: "AWSJSON",
            limit: "Int",
            nextToken: "String",
          }[f] || "String";
      return `$${f}: ${gqlType}`;
    })
    .join(", ");

  const argsList = fields.map((f) => `${f}: $${f}`).join(", ");

  const responseFields = modelFields
    .filter(
      (f) =>
        (!f.type.startsWith("[") && !f.type.match(/^[A-Z]\w+$/)) ||
        [
          "ID",
          "String",
          "Int",
          "Float",
          "Boolean",
          "AWSDateTime",
          "AWSJSON",
        ].some((t) => f.type.replace("!", "") === t),
    )
    .map((f) => `            ${f.name}`)
    .join("\n");

  return `
export const ${constName} = \`
    ${operationType} ${pascalName}(${varDeclarations}) {
        ${name}(${argsList}) {
${responseFields}
        }
    }
\`
`;
}

export function injectGraphql(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
  excludedModels: string[],
): void {
  const { name, model, dryRun } = options;
  const fileName = lcfirst(model) + ".ts";
  const filePath = path.join(paths.graphqlDir, fileName);
  const constName = toScreamingSnake(name);

  const newConstant = buildGraphqlConstant(
    options,
    paths.schemaPath,
    excludedModels,
  );

  if (existsSync(filePath)) {
    const content = readFileSync(filePath, "utf-8");

    if (content.includes(`export const ${constName}`)) {
      console.log(
        chalk.yellow(
          `  [skip] GraphQL constant "${constName}" already exists in ${fileName}`,
        ),
      );
      return;
    }

    if (dryRun) {
      console.log(chalk.cyan(`  [dry-run] Would append to ${fileName}:`));
      console.log(chalk.gray(newConstant.trim()));
    } else {
      writeFileSync(filePath, content.trimEnd() + "\n" + newConstant);
      console.log(
        chalk.green(
          `  [created] GraphQL constant "${constName}" in ${fileName}`,
        ),
      );
    }
  } else {
    if (dryRun) {
      console.log(chalk.cyan(`  [dry-run] Would create ${fileName}:`));
      console.log(chalk.gray(newConstant.trim()));
    } else {
      writeFileSync(filePath, newConstant.trimStart());
      console.log(
        chalk.green(`  [created] ${fileName} with constant "${constName}"`),
      );
    }
  }
}
