# lambda_function

## Usage

```hcl
module "lambda_function" {
  source = "../../modules/lambda_function"
  # ...
}
```

## Inputs

- `lambda_function_name`: Lambda function name.
- `zip_path`: Path to the deployment package zip.
- `handler`: Lambda handler (for example index.handler).
- `runtime`: (no description)
- `timeout`: (no description)
- `memory_size`: (no description)
- `environment_variables`: (no description)
- `layers`: (no description)
- `lambda_role_arn`: IAM Role ARN to assign to Lambda

## Outputs

- `lambda_function_name`: (no description)
- `lambda_function_arn`: (no description)
