import type {
  Action,
  DynamoDBOperation,
  ResolverType,
  RuntimeTarget,
  ScaffoldOptions,
} from "../../types.js";

export function parseArgs(argv: string[]): Partial<ScaffoldOptions> {
  const dryRun = argv.includes("--dry-run");

  function get(flag: string): string | undefined {
    const arg = argv.find((a) => a.startsWith(`--${flag}=`));
    return arg ? arg.split("=").slice(1).join("=") : undefined;
  }

  return {
    action: get("action") as Action | undefined,
    model: get("model"),
    type: get("type") as ResolverType | undefined,
    name: get("name"),
    runtime: get("runtime") as RuntimeTarget | undefined,
    operation: get("operation") as DynamoDBOperation | undefined,
    fields: get("fields")?.split(",").filter(Boolean),
    dryRun,
  };
}
