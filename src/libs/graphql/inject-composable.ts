import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { ScaffoldOptions, ResolvedPaths } from "../../types.js";
import { LIST_OPERATIONS } from "../../types.js";
import { extractModelFields } from "./schema-parser.js";
import { lcfirst, toScreamingSnake } from "./utils.js";

function graphqlTypeToTs(gqlType: string): string {
  const cleaned = gqlType.replace("!", "");
  const map: Record<string, string> = {
    ID: "string",
    String: "string",
    Int: "number",
    Float: "number",
    Boolean: "boolean",
    AWSDateTime: "string",
    AWSJSON: "string",
  };
  return map[cleaned] || "string";
}

function buildAsyncFunction(
  options: ScaffoldOptions,
  schemaPath: string,
  excludedModels: string[],
): string {
  const { name, model, fields, operation } = options;
  const constName = toScreamingSnake(name);

  const modelFields = extractModelFields(model, schemaPath, excludedModels);
  const params = fields
    .map((f) => {
      const modelField = modelFields.find((mf) => mf.name === f);
      const tsType = graphqlTypeToTs(modelField?.type || "String");
      return `${f}: ${tsType}`;
    })
    .join(", ");

  const isList = operation ? LIST_OPERATIONS.includes(operation) : false;
  const responseType = isList ? `${model}[]` : model;
  const responseInterface = `{ ${name}: ${responseType} }`;
  const fallback = isList ? "[]" : "null";

  const varsObj =
    fields.length === 1 ? `{ ${fields[0]} }` : `{ ${fields.join(", ")} }`;

  return `    async function ${name}(${params}) {
        const token = await getAccessToken()
        const { data, error } = await useGraphql<${responseInterface}>(
            ${constName},
            ${varsObj},
            { key: 'fetch:${name}', token }
        )
        if (error.value) throw error.value
        return data.value?.data?.${name} ?? ${fallback}
    }`;
}

function createComposable(
  options: ScaffoldOptions,
  schemaPath: string,
  excludedModels: string[],
): string {
  const { name, model } = options;
  const modelLower = lcfirst(model);
  const constName = toScreamingSnake(name);
  const asyncFn = buildAsyncFunction(options, schemaPath, excludedModels);

  return `import type { ${model} } from '~~/types/${model}'
import { ${constName} } from '~/graphql/${modelLower}'
import useGraphql from '~/composables/useGraphql'

export function use${model}() {
    const { getAccessToken } = useCognitoAuth()

${asyncFn}

    return { ${name} }
}
`;
}

export function injectComposable(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
  excludedModels: string[],
): void {
  const { name, model, dryRun } = options;
  const fileName = `use${model}.ts`;
  const filePath = path.join(paths.composablesDir, fileName);
  const constName = toScreamingSnake(name);
  const modelLower = lcfirst(model);

  if (!existsSync(filePath)) {
    const content = createComposable(options, paths.schemaPath, excludedModels);

    if (dryRun) {
      console.log(chalk.cyan(`  [dry-run] Would create ${fileName}:`));
      console.log(chalk.gray(content));
    } else {
      writeFileSync(filePath, content);
      console.log(
        chalk.green(`  [created] ${fileName} with function "${name}"`),
      );
    }
    return;
  }

  let content = readFileSync(filePath, "utf-8");

  if (content.includes(`async function ${name}(`)) {
    console.log(
      chalk.yellow(`  [skip] Function "${name}" already exists in ${fileName}`),
    );
    return;
  }

  const importLine = `import { ${constName} } from '~/graphql/${modelLower}'`;
  if (!content.includes(constName)) {
    const graphqlImportRegex = new RegExp(
      `import\\s*\\{([^}]+)\\}\\s*from\\s*'~/graphql/${modelLower}'`,
    );
    const importMatch = content.match(graphqlImportRegex);

    if (importMatch) {
      const existingImports = importMatch[1].trim();
      content = content.replace(
        graphqlImportRegex,
        `import { ${existingImports}, ${constName} } from '~/graphql/${modelLower}'`,
      );
    } else {
      const lastImportIndex = content.lastIndexOf("import ");
      const lineEnd = content.indexOf("\n", lastImportIndex);
      content =
        content.slice(0, lineEnd + 1) +
        importLine +
        "\n" +
        content.slice(lineEnd + 1);
    }
  }

  const asyncFn = buildAsyncFunction(options, paths.schemaPath, excludedModels);
  const returnMatch = content.match(/^(\s+)return\s*\{/m);
  if (returnMatch) {
    const returnIndex = content.indexOf(returnMatch[0]);
    content =
      content.slice(0, returnIndex) +
      asyncFn +
      "\n\n" +
      content.slice(returnIndex);
  }

  const returnObjRegex = /return\s*\{([^}]*)\}/;
  const returnObjMatch = content.match(returnObjRegex);
  if (returnObjMatch) {
    const existingReturn = returnObjMatch[1].trim();
    const newReturn = existingReturn.endsWith(",")
      ? `${existingReturn} ${name}`
      : `${existingReturn}, ${name}`;
    content = content.replace(returnObjRegex, `return { ${newReturn} }`);
  }

  if (dryRun) {
    console.log(chalk.cyan(`  [dry-run] Would inject into ${fileName}:`));
    console.log(chalk.gray(`    - Import: ${constName}`));
    console.log(chalk.gray(`    - Function: ${name}()`));
    console.log(chalk.gray(`    - Return: ${name}`));
  } else {
    writeFileSync(filePath, content);
    console.log(chalk.green(`  [created] Injected "${name}" into ${fileName}`));
  }
}
