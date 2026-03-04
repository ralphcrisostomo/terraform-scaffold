# iam_role

## Usage

```hcl
module "iam_role" {
  source = "../../modules/iam_role"
  # ...
}
```

## Inputs

- `name`: Name of the IAM role to create
- `lambda_dynamodb_table_arns`: (no description)
- `appsync_dynamodb_table_arns`: (no description)
- `s3_bucket_arns`: (no description)
- `ses_identity_arns`: (no description)
- `cognito_user_pool_arns`: (no description)
- `lambda_arns`: (no description)

## Outputs

- `lambda_role_arn`: (no description)
- `lambda_role_name`: (no description)
- `appsync_role_arn`: (no description)
