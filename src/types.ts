// ---- Config types ----

export interface TerraformScaffoldConfig {
  /** PascalCase prefix for Lambda function names (e.g., 'Pv5NuxtAppPlumber') */
  functionPrefix: string;
  /** Environment names (e.g., ['staging', 'production']) */
  environments: string[];
  /** Path overrides — all relative to project root */
  paths: TerraformScaffoldPaths;
  /** Lambda build configuration */
  lambdaBuild: LambdaBuildConfig;
  /** Model types excluded from scaffolding prompts */
  excludedModels: string[];
}

export interface TerraformScaffoldPaths {
  terraformModules: string;
  terraformEnvs: string;
  terraformFunctions: string;
  lambdaSrc: string;
  lambdaDist: string;
  schema: string;
  graphqlDir: string;
  composablesDir: string;
}

export interface LambdaBuildConfig {
  target: string;
  external: string[];
  aliases: Record<string, string>;
}

/** User-facing config input — all fields optional except required ones */
export interface TerraformScaffoldUserConfig {
  functionPrefix: string;
  environments: string[];
  paths?: Partial<TerraformScaffoldPaths>;
  lambdaBuild?: Partial<LambdaBuildConfig>;
  excludedModels?: string[];
}

// ---- GraphQL Scaffold types ----

export type Action = "create" | "delete";
export type ResolverType = "query" | "mutation";
export type RuntimeTarget = "APPSYNC_JS" | "LAMBDA";
export type DynamoDBOperation =
  | "GetItem"
  | "Query"
  | "PutItem"
  | "UpdateItem"
  | "Scan"
  | "BatchDeleteItem";

export interface ScaffoldOptions {
  action: Action;
  model: string;
  type: ResolverType;
  name: string;
  runtime: RuntimeTarget;
  operation?: DynamoDBOperation;
  fields: string[];
  dryRun: boolean;
}

export const DYNAMO_OPERATIONS: DynamoDBOperation[] = [
  "GetItem",
  "Query",
  "PutItem",
  "UpdateItem",
  "Scan",
  "BatchDeleteItem",
];

export const LIST_OPERATIONS: DynamoDBOperation[] = [
  "Query",
  "Scan",
  "BatchDeleteItem",
];

export const EXTRA_FIELDS: Record<string, string> = {
  "payload: AWSJSON": "payload",
  "filter: AWSJSON": "filter",
  "limit: Int": "limit",
  "nextToken: String": "nextToken",
};

// ---- Lambda Scaffold types ----

export type LambdaType = "standard" | "cron";

export interface LambdaScaffoldOptions {
  name: string;
  type: LambdaType;
  schedule?: string;
  dryRun: boolean;
}

// ---- Resolved project paths ----

export interface ResolvedPaths {
  projectRoot: string;
  functionPrefix: string;
  schemaPath: string;
  functionsDir: string;
  lambdaSrc: string;
  lambdaDist: string;
  graphqlDir: string;
  composablesDir: string;
  tfStagingDir: string;
  /** Path to the package's template directory */
  templatesDir: string;
  /** Path to the package's terraform-modules directory */
  terraformModulesDir: string;
}
