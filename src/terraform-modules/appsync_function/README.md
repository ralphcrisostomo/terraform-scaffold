# appsync_function

## Usage

```hcl
module "appsync_function" {
  source = "../../modules/appsync_function"
  # ...
}
```

## Inputs

- `api_id`: AppSync API ID
- `function_name`: Name of the AppSync function
- `data_source_name`: AppSync Data Source name
- `code_path`: Path to a plain JS resolver file (used if template_code_path is not set)
- `is_template`: Code is template file
- `environment_variables`: Map of values to expose to the resolver as ENVIRONMENT_VARIABLES (only used when template_code_path is provided).
- `template_vars`: Additional variables to pass to templatefile (merged with ENVIRONMENT_VARIABLES)
- `runtime_name`: AppSync function runtime
- `runtime_version`: AppSync function runtime version

## Outputs

- `function_id`: AppSync Function ID
