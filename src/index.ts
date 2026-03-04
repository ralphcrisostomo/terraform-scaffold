// Public API
export { defineConfig, loadConfig, resolveProjectPaths } from "./config.js";

export type {
  TerraformScaffoldConfig,
  TerraformScaffoldUserConfig,
  TerraformScaffoldPaths,
  LambdaBuildConfig,
  ResolvedPaths,
  ScaffoldOptions,
  LambdaScaffoldOptions,
  LambdaType,
  Action,
  ResolverType,
  RuntimeTarget,
  DynamoDBOperation,
} from "./types.js";

// Command runners (for programmatic use)
export { runGraphqlScaffold } from "./commands/graphql-scaffold.js";
export { runLambdaScaffold } from "./commands/lambda-scaffold.js";
export { runLambdaBuild } from "./commands/lambda-build.js";
export { runTerraformCommand } from "./commands/terraform.js";
export { runTerraformOutput } from "./commands/terraform-output.js";
export { runSyncModules } from "./commands/sync-modules.js";
export { runInit } from "./commands/init.js";
