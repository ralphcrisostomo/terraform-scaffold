# lambda_api_gateway

## Usage

```hcl
module "lambda_api_gateway" {
  source = "../../modules/lambda_api_gateway"
  # ...
}
```

## Inputs

- `api_name`: Name of the API Gateway API
- `lambda_function_name`: Lambda function name
- `lambda_function_arn`: Lambda function ARN
- `integration_timeout_milliseconds`: Timeout for Lambda integration (50-30000 ms).

## Outputs

- `api_gateway_id`: (no description)
- `api_gateway_endpoint`: The default endpoint of the API Gateway.
- `api_stage_name`: (no description)
- `api_execution_arn`: (no description)
