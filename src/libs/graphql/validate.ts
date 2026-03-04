import chalk from "chalk";
import type { ScaffoldOptions } from "../../types.js";

export function validate(options: ScaffoldOptions): void {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(options.name)) {
    console.error(
      chalk.red(
        `Invalid name "${options.name}". Must be camelCase (start with lowercase letter, alphanumeric only).`,
      ),
    );
    process.exit(1);
  }

  if (options.type !== "query" && options.type !== "mutation") {
    console.error(
      chalk.red(
        `Invalid type "${options.type}". Must be "query" or "mutation".`,
      ),
    );
    process.exit(1);
  }

  if (options.runtime !== "APPSYNC_JS" && options.runtime !== "LAMBDA") {
    console.error(
      chalk.red(
        `Invalid runtime "${options.runtime}". Must be "APPSYNC_JS" or "LAMBDA".`,
      ),
    );
    process.exit(1);
  }

  if (options.runtime === "APPSYNC_JS" && !options.operation) {
    console.error(
      chalk.red("DynamoDB operation is required for APPSYNC_JS runtime."),
    );
    process.exit(1);
  }

  if (!options.fields || options.fields.length === 0) {
    console.error(chalk.red("At least one field must be selected."));
    process.exit(1);
  }
}
