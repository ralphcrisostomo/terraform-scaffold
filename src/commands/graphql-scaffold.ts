import chalk from "chalk";
import type { TerraformScaffoldConfig, ResolvedPaths } from "../types.js";
import { parseArgs } from "../libs/graphql/parse-args.js";
import { promptMissing } from "../libs/graphql/prompt-missing.js";
import { validate } from "../libs/graphql/validate.js";
import { injectSchema } from "../libs/graphql/inject-schema.js";
import { injectGraphql } from "../libs/graphql/inject-graphql.js";
import { injectTerraform } from "../libs/graphql/inject-terraform.js";
import { injectFunction } from "../libs/graphql/inject-function.js";
import { injectLambda } from "../libs/graphql/inject-lambda.js";
import { injectComposable } from "../libs/graphql/inject-composable.js";
import { deleteArtifacts } from "../libs/graphql/delete-artifacts.js";
import { toPascal } from "../libs/graphql/utils.js";

export async function runGraphqlScaffold(
  argv: string[],
  config: TerraformScaffoldConfig,
  paths: ResolvedPaths,
): Promise<void> {
  const partial = parseArgs(argv);
  const options = await promptMissing(partial, paths, config.excludedModels);

  if (options.action !== "delete") {
    validate(options);
  }

  console.log(chalk.bold(`\nGraphQL Scaffold — ${options.name}\n`));
  console.log(chalk.gray(`  Action:   ${options.action}`));
  console.log(chalk.gray(`  Model:    ${options.model}`));
  console.log(chalk.gray(`  Type:     ${options.type}`));
  console.log(chalk.gray(`  Runtime:  ${options.runtime}`));
  if (options.operation) {
    console.log(chalk.gray(`  Operation: ${options.operation}`));
  }
  if (options.fields.length > 0) {
    console.log(chalk.gray(`  Fields:   ${options.fields.join(", ")}`));
  }
  if (options.dryRun) {
    console.log(chalk.cyan("  Mode:     DRY RUN"));
  }
  console.log("");

  if (options.action === "delete") {
    deleteArtifacts(options, paths);
    console.log("");
    return;
  }

  injectSchema(options, paths, config.excludedModels);
  injectGraphql(options, paths, config.excludedModels);
  injectTerraform(options, paths);

  if (options.runtime === "APPSYNC_JS") {
    injectFunction(options, paths);
  }

  if (options.runtime === "LAMBDA") {
    injectLambda(options, paths);
  }

  injectComposable(options, paths, config.excludedModels);

  if (!options.dryRun) {
    console.log(chalk.bold("\n  Next steps:\n"));
    console.log(chalk.gray(`  1. Review generated code in all target files`));
    if (options.runtime === "APPSYNC_JS") {
      console.log(
        chalk.gray(
          `  2. Customize terraform/functions/${options.name}.js if needed`,
        ),
      );
    } else {
      const fullName = `${config.functionPrefix}${toPascal(options.name)}`;
      console.log(
        chalk.gray(
          `  2. Implement handler in terraform/lambda/src/${fullName}/index.ts`,
        ),
      );
      console.log(
        chalk.gray(
          `  3. Build: terraform-scaffold build --env=staging --function=${fullName}`,
        ),
      );
    }
    console.log(
      chalk.gray(
        `  ${options.runtime === "LAMBDA" ? "4" : "3"}. Deploy: terraform-scaffold tf staging plan → terraform-scaffold tf staging apply`,
      ),
    );
  }

  console.log("");
}
