import { checkbox, input, select } from "@inquirer/prompts";
import type {
  Action,
  DynamoDBOperation,
  ResolverType,
  RuntimeTarget,
  ScaffoldOptions,
  ResolvedPaths,
} from "../../types.js";
import { DYNAMO_OPERATIONS, EXTRA_FIELDS } from "../../types.js";
import { parseModels } from "./schema-parser.js";

export async function promptMissing(
  partial: Partial<ScaffoldOptions>,
  paths: ResolvedPaths,
  excludedModels: string[],
): Promise<ScaffoldOptions> {
  const action: Action =
    partial.action ||
    ((await select({
      message: "Action:",
      choices: [
        { name: "Create", value: "create" as Action },
        { name: "Delete", value: "delete" as Action },
      ],
    })) as Action);

  const models = parseModels(paths.schemaPath, excludedModels);
  const model =
    partial.model ||
    ((await select({
      message: "Model:",
      choices: models.map((m) => ({
        name: m.name,
        value: m.name,
      })),
    })) as string);

  const type: ResolverType =
    partial.type ||
    ((await select({
      message: "Resolver type:",
      choices: [
        { name: "Query", value: "query" as ResolverType },
        { name: "Mutation", value: "mutation" as ResolverType },
      ],
    })) as ResolverType);

  const name =
    partial.name ||
    (await input({
      message: "Resolver name (camelCase):",
      validate: (v) =>
        /^[a-z][a-zA-Z0-9]*$/.test(v) ||
        "Must be camelCase (start with lowercase letter, alphanumeric only)",
    }));

  if (action === "delete") {
    return {
      action,
      model,
      type,
      name,
      runtime: partial.runtime || "APPSYNC_JS",
      fields: [],
      dryRun: partial.dryRun || false,
    };
  }

  const runtime: RuntimeTarget =
    partial.runtime ||
    ((await select({
      message: "Runtime target:",
      choices: [
        { name: "APPSYNC_JS", value: "APPSYNC_JS" as RuntimeTarget },
        { name: "LAMBDA", value: "LAMBDA" as RuntimeTarget },
      ],
    })) as RuntimeTarget);

  let operation: DynamoDBOperation | undefined = partial.operation;
  if (runtime === "APPSYNC_JS" && !operation) {
    operation = (await select({
      message: "DynamoDB operation:",
      choices: DYNAMO_OPERATIONS.map((op) => ({
        name: op,
        value: op,
      })),
    })) as DynamoDBOperation;
  }

  const modelInfo = models.find((m) => m.name === model);
  const modelFields = modelInfo?.fields.map((f) => f.name) ?? [];

  const fields: string[] =
    partial.fields ||
    ((await checkbox({
      message: "Input parameters:",
      choices: [
        ...modelFields.map((f) => ({
          name: f,
          value: f,
        })),
        ...Object.entries(EXTRA_FIELDS).map(([label, value]) => ({
          name: label,
          value,
        })),
      ],
    })) as string[]);

  return {
    action,
    model,
    type,
    name,
    runtime,
    operation,
    fields,
    dryRun: partial.dryRun || false,
  };
}
