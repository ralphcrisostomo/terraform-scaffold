import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import type { TerraformScaffoldConfig } from "../types.js";

type Action = "init" | "plan" | "apply";

const VALID_ACTIONS: Action[] = ["init", "plan", "apply"];

function usage(): string {
  return [
    "Usage: terraform-scaffold tf <environment> <action> [-- <terraform args>]",
    "  environment: staging | production",
    "  action: init | plan | apply",
  ].join("\n");
}

function runTerraform(args: string[]): void {
  const result = spawnSync("terraform", args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(
      "[terraform-runner] failed to execute terraform:",
      result.error.message,
    );
    process.exitCode = 1;
    process.exit();
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exitCode = result.status;
    process.exit();
  }
}

export function runTerraformCommand(
  argv: string[],
  config: TerraformScaffoldConfig,
): void {
  const separatorIndex = argv.indexOf("--");
  const baseArgs = separatorIndex === -1 ? argv : argv.slice(0, separatorIndex);
  const extraArgs = separatorIndex === -1 ? [] : argv.slice(separatorIndex + 1);

  const [environmentArg, actionArg] = baseArgs;

  if (!environmentArg || !actionArg) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  if (!config.environments.includes(environmentArg)) {
    console.error(
      `Invalid environment: ${environmentArg}\nValid: ${config.environments.join(", ")}\n${usage()}`,
    );
    process.exitCode = 1;
    return;
  }

  if (!VALID_ACTIONS.includes(actionArg as Action)) {
    console.error(`Invalid action: ${actionArg}\n${usage()}`);
    process.exitCode = 1;
    return;
  }

  const environment = environmentArg;
  const action = actionArg as Action;
  const envDir = `${config.paths.terraformEnvs}/${environment}`;
  const planFile = `.terraform/${environment}.tfplan`;

  mkdirSync(resolve(envDir, ".terraform"), { recursive: true });

  const chdirArgs = ["-chdir=" + envDir];

  if (action === "init") {
    runTerraform([
      ...chdirArgs,
      "init",
      "-reconfigure",
      "-backend-config=backend.hcl",
      ...extraArgs,
    ]);
    return;
  }

  if (action === "plan") {
    runTerraform([
      ...chdirArgs,
      "plan",
      "-var-file=terraform.tfvars",
      "-out=" + planFile,
      ...extraArgs,
    ]);
    return;
  }

  // Apply: always creates a fresh plan file first
  runTerraform([
    ...chdirArgs,
    "plan",
    "-var-file=terraform.tfvars",
    "-out=" + planFile,
  ]);

  runTerraform([...chdirArgs, "apply", planFile, ...extraArgs]);
}
