import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { input, select } from "@inquirer/prompts";
import type {
  TerraformScaffoldConfig,
  ResolvedPaths,
  LambdaType,
  LambdaScaffoldOptions,
} from "../types.js";

function parseArgs(argv: string[]): Partial<LambdaScaffoldOptions> {
  const dryRun = argv.includes("--dry-run");
  const nameArg = argv.find((arg) => arg.startsWith("--name="));
  const name = nameArg ? nameArg.split("=")[1] : undefined;
  const typeArg = argv.find((arg) => arg.startsWith("--type="));
  const type = typeArg ? (typeArg.split("=")[1] as LambdaType) : undefined;
  const scheduleArg = argv.find((arg) => arg.startsWith("--schedule="));
  const schedule = scheduleArg ? scheduleArg.split("=")[1] : undefined;
  return { name, type, schedule, dryRun };
}

async function promptMissing(
  partial: Partial<LambdaScaffoldOptions>,
): Promise<LambdaScaffoldOptions> {
  const name =
    partial.name ||
    (await input({
      message: "Lambda function name suffix (e.g., RedeemNow):",
      validate: (v) =>
        /^[A-Z][a-zA-Z0-9]*$/.test(v) ||
        "Must be PascalCase (start with uppercase letter, alphanumeric only)",
    }));

  const type =
    partial.type ||
    ((await select({
      message: "Lambda type:",
      choices: [
        { name: "Standard", value: "standard" as LambdaType },
        {
          name: "Cron (scheduled via EventBridge)",
          value: "cron" as LambdaType,
        },
      ],
    })) as LambdaType);

  let schedule = partial.schedule;
  if (type === "cron" && !schedule) {
    schedule = await input({
      message: "EventBridge schedule expression (e.g., rate(5 minutes)):",
      validate: (v) => v.trim().length > 0 || "Schedule expression is required",
    });
  }

  return { name, type, schedule, dryRun: partial.dryRun || false };
}

function validate(options: LambdaScaffoldOptions): void {
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(options.name)) {
    console.error(
      chalk.red(
        `Invalid name "${options.name}". Must be PascalCase (start with uppercase letter, alphanumeric only).`,
      ),
    );
    process.exit(1);
  }

  if (options.type !== "standard" && options.type !== "cron") {
    console.error(
      chalk.red(
        `Invalid type "${options.type}". Must be "standard" or "cron".`,
      ),
    );
    process.exit(1);
  }

  if (options.type === "cron" && !options.schedule) {
    console.error(
      chalk.red("Schedule expression is required for cron lambdas."),
    );
    process.exit(1);
  }
}

function lcfirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function generateModuleBlock(
  pascalSuffix: string,
  camelSuffix: string,
): string {
  return `
module "lambda_function_${camelSuffix}" {
  source               = "../../modules/lambda_function"
  lambda_function_name = "\${var.PROJECT_ENV}${pascalSuffix}"
  zip_path             = "../../\${path.module}/lambda/dist/\${var.PROJECT_ENV}${pascalSuffix}.zip"
  handler              = "index.handler"
  lambda_role_arn      = module.role.lambda_role_arn
  environment_variables = {
    ENV            = var.ENV
    SERVER_VERSION = local.SERVER_VERSION
    PROJECT        = var.PROJECT_ENV
  }
}
`;
}

function generateCronBlock(
  pascalSuffix: string,
  camelSuffix: string,
  schedule: string,
): string {
  return `
# ${pascalSuffix} CRON START
resource "aws_cloudwatch_event_rule" "lambda_cron_${camelSuffix}" {
  name                = "\${var.PROJECT_ENV}${pascalSuffix}Schedule"
  schedule_expression = "${schedule}"
}

resource "aws_cloudwatch_event_target" "lambda_cron_${camelSuffix}" {
  rule      = aws_cloudwatch_event_rule.lambda_cron_${camelSuffix}.name
  target_id = "\${var.PROJECT_ENV}${pascalSuffix}"
  arn       = module.lambda_function_${camelSuffix}.lambda_function_arn
}

resource "aws_lambda_permission" "lambda_cron_${camelSuffix}" {
  statement_id  = "AllowExecutionFromEventBridge${pascalSuffix}"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_function_${camelSuffix}.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_cron_${camelSuffix}.arn
}
# ${pascalSuffix} CRON END
`;
}

export async function runLambdaScaffold(
  argv: string[],
  config: TerraformScaffoldConfig,
  paths: ResolvedPaths,
): Promise<void> {
  const partial = parseArgs(argv);
  const options = await promptMissing(partial);
  validate(options);

  const fullName = `${config.functionPrefix}${options.name}`;
  const camelSuffix = lcfirst(options.name);
  const pascalSuffix = options.name;
  const srcDir = path.join(paths.lambdaSrc, fullName);

  console.log(chalk.bold(`\nLambda Scaffold — ${fullName}\n`));
  console.log(chalk.gray(`  Type:     ${options.type}`));
  if (options.schedule) {
    console.log(chalk.gray(`  Schedule: ${options.schedule}`));
  }
  console.log(chalk.gray(`  Source:   terraform/lambda/src/${fullName}/`));
  console.log(
    chalk.gray(`  TF:       terraform/envs/staging/lambda_function.tf`),
  );
  console.log("");

  const srcExists = existsSync(srcDir);
  if (srcExists) {
    console.log(
      chalk.yellow(
        `  [skip] Source directory already exists: terraform/lambda/src/${fullName}/`,
      ),
    );
  } else {
    const lambdaTemplatesDir = path.join(paths.templatesDir, "lambda");
    const indexTemplate = readFileSync(
      path.join(lambdaTemplatesDir, "index.ts.tpl"),
      "utf-8",
    );
    const agentsTemplate = readFileSync(
      path.join(lambdaTemplatesDir, "AGENTS.md.tpl"),
      "utf-8",
    );
    const geminiTemplate = readFileSync(
      path.join(lambdaTemplatesDir, "GEMINI.md.tpl"),
      "utf-8",
    );

    const indexContent = indexTemplate.replace(/\{\{FULL_NAME\}\}/g, fullName);
    const agentsContent = agentsTemplate.replace(
      /\{\{DESCRIPTION\}\}/g,
      `TODO: describe ${options.name} lambda purpose.`,
    );
    const packageJson =
      JSON.stringify({ version: "0.0.1", lastBuildAt: "" }, null, 2) + "\n";

    if (options.dryRun) {
      console.log(chalk.cyan("  [dry-run] Would create source files:"));
      console.log(chalk.gray(`    ${fullName}/index.ts`));
      console.log(chalk.gray(`    ${fullName}/package.json`));
      console.log(chalk.gray(`    ${fullName}/AGENTS.md`));
      console.log(chalk.gray(`    ${fullName}/GEMINI.md`));
    } else {
      mkdirSync(srcDir, { recursive: true });
      writeFileSync(path.join(srcDir, "index.ts"), indexContent);
      writeFileSync(path.join(srcDir, "package.json"), packageJson);
      writeFileSync(path.join(srcDir, "AGENTS.md"), agentsContent);
      writeFileSync(path.join(srcDir, "GEMINI.md"), geminiTemplate);
      console.log(
        chalk.green(`  [created] terraform/lambda/src/${fullName}/ (4 files)`),
      );
    }
  }

  const tfFile = path.join(paths.tfStagingDir, "lambda_function.tf");
  const tfContent = readFileSync(tfFile, "utf-8");
  const moduleId = `module "lambda_function_${camelSuffix}"`;
  const tfModuleExists = tfContent.includes(moduleId);

  if (tfModuleExists) {
    console.log(
      chalk.yellow(
        `  [skip] TF module already exists: lambda_function_${camelSuffix}`,
      ),
    );
  } else {
    const moduleBlock = generateModuleBlock(pascalSuffix, camelSuffix);
    const cronBlock =
      options.type === "cron"
        ? generateCronBlock(pascalSuffix, camelSuffix, options.schedule!)
        : "";

    const appendContent = moduleBlock + cronBlock;

    if (options.dryRun) {
      console.log(
        chalk.cyan("  [dry-run] Would append to lambda_function.tf:\n"),
      );
      console.log(chalk.gray(appendContent));
    } else {
      writeFileSync(tfFile, tfContent.trimEnd() + "\n" + appendContent);
      console.log(
        chalk.green(
          "  [created] TF module block appended to lambda_function.tf",
        ),
      );
      if (options.type === "cron") {
        console.log(
          chalk.green(
            "  [created] EventBridge cron resources appended to lambda_function.tf",
          ),
        );
      }
    }
  }

  if (srcExists && tfModuleExists) {
    console.log(
      chalk.yellow("\n  Nothing to do — lambda already fully scaffolded."),
    );
    return;
  }

  if (!options.dryRun) {
    console.log(chalk.bold("\n  Next steps:\n"));
    console.log(
      chalk.gray(
        `  1. Edit terraform/lambda/src/${fullName}/index.ts with your handler logic`,
      ),
    );
    console.log(
      chalk.gray(
        `  2. Update terraform/lambda/src/${fullName}/AGENTS.md with the lambda's purpose`,
      ),
    );
    console.log(
      chalk.gray(
        `  3. Add the lambda ARN to the IAM role's lambda_arns list in lambda_function.tf`,
      ),
    );
    console.log(
      chalk.gray(
        `  4. Build: terraform-scaffold build --env=staging --function=${fullName}`,
      ),
    );
    console.log(
      chalk.gray(
        `  5. Deploy: terraform-scaffold tf staging plan → terraform-scaffold tf staging apply`,
      ),
    );
  }

  console.log("");
}
