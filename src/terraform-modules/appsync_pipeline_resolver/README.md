# appsync_pipeline_resolver

## Usage

```hcl
module "appsync_pipeline_resolver" {
  source = "../../modules/appsync_pipeline_resolver"
  # ...
}
```

## Inputs

- `api_id`: AppSync API ID
- `type`: GraphQL type (e.g. Mutation, Query)
- `field`: Field name in the schema (e.g. createUser)
- `code_path`: Path to the base function code (e.g. base.js)
- `function_ids`: List of AppSync function IDs to be executed in the pipeline
- `runtime_name`: AppSync function runtime
- `runtime_version`: AppSync function runtime version

## Outputs

- None
