# terraform-scaffold

CLI tool and programmatic API for scaffolding AWS infrastructure with Terraform, AppSync, and Lambda.

## Installation

```bash
bun add -D terraform-scaffold
```

## Quick Start

```bash
# Initialize a new project with full Terraform directory structure
npx terraform-scaffold init

# Scaffold a GraphQL resolver (AppSync JS or Lambda)
npx terraform-scaffold graphql

# Scaffold a standalone Lambda function
npx terraform-scaffold lambda

# Build Lambda zip bundles
npx terraform-scaffold build --env=staging

# Run Terraform commands
npx terraform-scaffold tf staging plan
npx terraform-scaffold tf staging apply

# Export Terraform outputs to .env
npx terraform-scaffold tf-output staging

# Sync Terraform modules from the package
npx terraform-scaffold sync-modules
```

## Configuration

Create `terraform-scaffold.config.ts` in your project root:

```typescript
import { defineConfig } from "terraform-scaffold";

export default defineConfig({
  functionPrefix: "MyAppName",
  environments: ["staging", "production"],
});
```

## Commands

| Command             | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `init`              | Generate config file + full Terraform directory structure      |
| `graphql`           | Scaffold a GraphQL resolver (schema, TF, function, composable) |
| `lambda`            | Scaffold a standalone Lambda function                          |
| `build --env=<env>` | Build Lambda zip bundles with esbuild                          |
| `tf <env> <action>` | Run terraform init/plan/apply                                  |
| `tf-output <env>`   | Export Terraform outputs to .env files                         |
| `sync-modules`      | Copy Terraform modules from the package to your project        |
