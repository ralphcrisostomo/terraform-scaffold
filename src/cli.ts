import { Command } from "commander";
import chalk from "chalk";
import { loadConfig, resolveProjectPaths } from "./config.js";
import type { TerraformScaffoldConfig, ResolvedPaths } from "./types.js";

const program = new Command();

program
  .name("terraform-scaffold")
  .description("Infrastructure scaffolding and management CLI")
  .version("1.0.0");

// Helper to load config and resolve paths
async function getConfigAndPaths(): Promise<{
  config: TerraformScaffoldConfig;
  paths: ResolvedPaths;
}> {
  try {
    const config = await loadConfig();
    const paths = resolveProjectPaths(config);
    return { config, paths };
  } catch {
    console.error(
      chalk.red(
        "No terraform-scaffold.config.ts found.\n\n" +
          `  Run ${chalk.cyan("npx terraform-scaffold init")} to get started.\n`,
      ),
    );
    process.exit(1);
  }
}

// init — does not require existing config
program
  .command("init")
  .description("Initialize a new project with terraform-scaffold")
  .option("--dry-run", "Preview without creating files")
  .action(async (_opts, cmd) => {
    const { runInit } = await import("./commands/init.js");
    await runInit(cmd.args);
  });

// sync-modules
program
  .command("sync-modules")
  .description("Sync terraform modules from package to project")
  .option("--check", "Check for drift without copying")
  .option("--force", "Overwrite locally modified files")
  .action(async (_opts, cmd) => {
    const { config, paths } = await getConfigAndPaths();
    const { runSyncModules } = await import("./commands/sync-modules.js");
    await runSyncModules(cmd.args, config, paths);
  });

// graphql
program
  .command("graphql")
  .description("Scaffold a GraphQL resolver (AppSync JS or Lambda)")
  .option("--action <action>", "create or delete")
  .option("--model <model>", "DynamoDB model name")
  .option("--type <type>", "query or mutation")
  .option("--name <name>", "Resolver name")
  .option("--runtime <runtime>", "APPSYNC_JS or LAMBDA")
  .option("--operation <operation>", "DynamoDB operation")
  .option("--fields <fields>", "Comma-separated fields")
  .option("--dry-run", "Preview without creating files")
  .allowUnknownOption(true)
  .action(async (_opts, cmd) => {
    const { config, paths } = await getConfigAndPaths();
    const { runGraphqlScaffold } =
      await import("./commands/graphql-scaffold.js");
    await runGraphqlScaffold(process.argv.slice(3), config, paths);
  });

// lambda
program
  .command("lambda")
  .description("Scaffold a standalone Lambda function")
  .option("--name <name>", "Lambda function name suffix (PascalCase)")
  .option("--type <type>", "standard or cron")
  .option("--schedule <schedule>", "EventBridge schedule expression")
  .option("--dry-run", "Preview without creating files")
  .allowUnknownOption(true)
  .action(async (_opts, cmd) => {
    const { config, paths } = await getConfigAndPaths();
    const { runLambdaScaffold } = await import("./commands/lambda-scaffold.js");
    await runLambdaScaffold(process.argv.slice(3), config, paths);
  });

// build
program
  .command("build")
  .description("Build Lambda function zip bundles")
  .requiredOption("--env <environment>", "staging or production")
  .option("--function <name>", "Build a specific function only")
  .allowUnknownOption(true)
  .action(async (_opts, cmd) => {
    const { config, paths } = await getConfigAndPaths();
    const { runLambdaBuild } = await import("./commands/lambda-build.js");
    await runLambdaBuild(process.argv.slice(3), config, paths);
  });

// tf — terraform wrapper
program
  .command("tf")
  .description("Run terraform init/plan/apply for an environment")
  .argument("<environment>", "Target environment (e.g., staging, production)")
  .argument("<action>", "Terraform action: init, plan, or apply")
  .allowUnknownOption(true)
  .action(async (_env, _action, _opts, cmd) => {
    const { config } = await getConfigAndPaths();
    const { runTerraformCommand } = await import("./commands/terraform.js");
    runTerraformCommand(process.argv.slice(3), config);
  });

// tf-output — export terraform outputs to .env
program
  .command("tf-output")
  .description("Export terraform outputs to .env files")
  .argument("<environment>", "Target environment (e.g., staging, production)")
  .action(async (_env, _opts, cmd) => {
    const { config } = await getConfigAndPaths();
    const { runTerraformOutput } =
      await import("./commands/terraform-output.js");
    await runTerraformOutput(process.argv.slice(3), config);
  });

program.parse();
