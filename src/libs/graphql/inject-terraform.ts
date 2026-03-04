import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { ScaffoldOptions, ResolvedPaths } from "../../types.js";
import { lcfirst, toPascal } from "./utils.js";

function generateAppsyncJsBlocks(options: ScaffoldOptions): string {
  const { name, model, type } = options;
  const modelLower = lcfirst(model);
  const resolverType = type === "query" ? "Query" : "Mutation";

  return `
module "appsync_function_${name}" {
  source           = "../../modules/appsync_function"
  api_id           = module.appsync.graphql_api_id
  function_name    = "${name}"
  data_source_name = module.appsync_datasource_${modelLower}.data_source_name
  code_path        = "../../functions/${name}.js"
}

module "appsync_pipeline_resolver_${name}" {
  source       = "../../modules/appsync_pipeline_resolver"
  api_id       = module.appsync.graphql_api_id
  type         = "${resolverType}"
  field        = "${name}"
  code_path    = "../../functions/base.js"
  function_ids = [module.appsync_function_${name}.function_id]
}
`;
}

function generateLambdaBlocks(options: ScaffoldOptions): string {
  const { name, type } = options;
  const pascalName = toPascal(name);
  const resolverType = type === "query" ? "Query" : "Mutation";

  return `
# Note: ${name} START
module "lambda_function_${name}" {
  source               = "../../modules/lambda_function"
  lambda_function_name = "\${var.PROJECT_ENV}${pascalName}"
  zip_path             = "../../\${path.module}/lambda/dist/\${var.PROJECT_ENV}${pascalName}.zip"
  handler              = "index.handler"
  lambda_role_arn      = module.role.lambda_role_arn
  environment_variables = {
    ENV            = var.ENV
    SERVER_VERSION = local.SERVER_VERSION
    PROJECT        = var.PROJECT_ENV
  }
}

module "appsync_datasource_${name}" {
  source           = "../../modules/appsync_datasource"
  api_id           = module.appsync.graphql_api_id
  lambda_arn       = module.lambda_function_${name}.lambda_function_arn
  service_role_arn = module.role.appsync_role_arn
}

module "appsync_function_${name}" {
  source           = "../../modules/appsync_function"
  api_id           = module.appsync.graphql_api_id
  function_name    = "${name}"
  data_source_name = module.appsync_datasource_${name}.data_source_name
  code_path        = "../../functions/invoke.js"
}

module "appsync_pipeline_resolver_${name}" {
  source       = "../../modules/appsync_pipeline_resolver"
  api_id       = module.appsync.graphql_api_id
  type         = "${resolverType}"
  field        = "${name}"
  code_path    = "../../functions/base.js"
  function_ids = [module.appsync_function_${name}.function_id]
}
# Note: ${name} END
`;
}

function ensureInfraBlocks(
  content: string,
  model: string,
  dryRun: boolean,
  filePath: string,
): string {
  const modelLower = lcfirst(model);

  const dynamoId = `module "dynamodb_${modelLower}s"`;
  if (!content.includes(dynamoId)) {
    if (dryRun) {
      console.log(
        chalk.cyan(
          `  [dry-run] Would need DynamoDB table module for ${model} — please add manually`,
        ),
      );
    } else {
      console.log(
        chalk.yellow(
          `  [warn] DynamoDB table module "${dynamoId}" not found in ${path.basename(filePath)} — ensure it exists`,
        ),
      );
    }
  }

  const datasourceId = `module "appsync_datasource_${modelLower}"`;
  if (!content.includes(datasourceId)) {
    if (dryRun) {
      console.log(
        chalk.cyan(
          `  [dry-run] Would need AppSync datasource module for ${model} — please add manually`,
        ),
      );
    } else {
      console.log(
        chalk.yellow(
          `  [warn] AppSync datasource module "${datasourceId}" not found in ${path.basename(filePath)} — ensure it exists`,
        ),
      );
    }
  }

  return content;
}

export function injectTerraform(
  options: ScaffoldOptions,
  paths: ResolvedPaths,
): void {
  const { name, model, runtime, dryRun } = options;
  const modelLower = lcfirst(model);
  const fileName = `${modelLower}.tf`;
  const filePath = path.join(paths.tfStagingDir, fileName);

  if (!existsSync(filePath)) {
    console.error(
      chalk.red(
        `  [error] TF file not found: ${fileName}. Create the file first.`,
      ),
    );
    process.exit(1);
  }

  let content = readFileSync(filePath, "utf-8");

  const functionId = `module "appsync_function_${name}"`;
  if (content.includes(functionId)) {
    console.log(
      chalk.yellow(
        `  [skip] TF module "${functionId}" already exists in ${fileName}`,
      ),
    );
    return;
  }

  const newBlocks =
    runtime === "APPSYNC_JS"
      ? generateAppsyncJsBlocks(options)
      : generateLambdaBlocks(options);

  if (runtime === "APPSYNC_JS") {
    content = ensureInfraBlocks(content, model, dryRun, filePath);
  }

  if (dryRun) {
    console.log(chalk.cyan(`  [dry-run] Would append to ${fileName}:`));
    console.log(chalk.gray(newBlocks.trim()));
  } else {
    writeFileSync(filePath, content.trimEnd() + "\n" + newBlocks);
    console.log(
      chalk.green(`  [created] TF modules for "${name}" in ${fileName}`),
    );
  }
}
