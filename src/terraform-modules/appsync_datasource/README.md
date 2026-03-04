# appsync_datasource

## Usage

```hcl
module "appsync_datasource" {
  source = "../../modules/appsync_datasource"
  # ...
}
```

## Inputs

- `api_id`: AppSync API ID
- `table_name`: DynamoDB table name (leave empty if not using DynamoDB)
- `lambda_arn`: Lambda function ARN (leave empty if not using Lambda)
- `service_role_arn`: IAM Role ARN AppSync will use

## Outputs

- `data_source_name`: (no description)
