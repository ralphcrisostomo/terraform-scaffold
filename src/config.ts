import path from "node:path";
import { fileURLToPath } from "node:url";
import { cosmiconfig } from "cosmiconfig";
import type {
  TerraformScaffoldConfig,
  TerraformScaffoldUserConfig,
  ResolvedPaths,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PATHS = {
  terraformModules: "terraform/modules",
  terraformEnvs: "terraform/envs",
  terraformFunctions: "terraform/functions",
  lambdaSrc: "terraform/lambda/src",
  lambdaDist: "terraform/lambda/dist",
  schema: "terraform/envs/staging/schema.graphql",
  graphqlDir: "app/graphql",
  composablesDir: "app/composables",
};

const DEFAULT_LAMBDA_BUILD = {
  target: "node20",
  external: ["aws-sdk", "@aws-sdk/*", "@aws-appsync/utils"],
  aliases: { "~~": ".", "#server": "./server" },
};

export function defineConfig(
  config: TerraformScaffoldUserConfig,
): TerraformScaffoldUserConfig {
  return config;
}

export async function loadConfig(): Promise<TerraformScaffoldConfig> {
  const explorer = cosmiconfig("terraform-scaffold", {
    searchPlaces: [
      "terraform-scaffold.config.ts",
      "terraform-scaffold.config.js",
      "terraform-scaffold.config.json",
      "terraform-scaffold.config.mjs",
      "terraform-scaffold.config.cjs",
    ],
  });

  const result = await explorer.search();

  if (!result || result.isEmpty) {
    throw new Error(
      "No terraform-scaffold config found. Run `terraform-scaffold init` to create one.",
    );
  }

  const userConfig = result.config as TerraformScaffoldUserConfig;

  if (!userConfig.functionPrefix) {
    throw new Error("Config missing required field: functionPrefix");
  }
  if (!userConfig.environments || userConfig.environments.length === 0) {
    throw new Error("Config missing required field: environments");
  }

  return {
    functionPrefix: userConfig.functionPrefix,
    environments: userConfig.environments,
    paths: { ...DEFAULT_PATHS, ...userConfig.paths },
    lambdaBuild: { ...DEFAULT_LAMBDA_BUILD, ...userConfig.lambdaBuild },
    excludedModels: userConfig.excludedModels ?? [],
  };
}

/** Resolve the package's own asset directories (templates, terraform-modules) */
function getPackageDir(): string {
  // In dist/, __dirname is the dist folder
  // Templates and modules are shipped under src/ in the published package
  return path.resolve(__dirname, "..");
}

export function resolveProjectPaths(
  config: TerraformScaffoldConfig,
): ResolvedPaths {
  const projectRoot = process.cwd();
  const packageDir = getPackageDir();

  return {
    projectRoot,
    functionPrefix: config.functionPrefix,
    schemaPath: path.join(projectRoot, config.paths.schema),
    functionsDir: path.join(projectRoot, config.paths.terraformFunctions),
    lambdaSrc: path.join(projectRoot, config.paths.lambdaSrc),
    lambdaDist: path.join(projectRoot, config.paths.lambdaDist),
    graphqlDir: path.join(projectRoot, config.paths.graphqlDir),
    composablesDir: path.join(projectRoot, config.paths.composablesDir),
    tfStagingDir: path.join(projectRoot, config.paths.terraformEnvs, "staging"),
    templatesDir: path.join(packageDir, "src", "templates"),
    terraformModulesDir: path.join(packageDir, "src", "terraform-modules"),
  };
}
