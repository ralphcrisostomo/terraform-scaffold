# appsync

## Usage

```hcl
module "appsync" {
  source = "../../modules/appsync"
  # ...
}
```

## Inputs

- `project`: Project name prefix
- `aws_region`: AWS region
- `schema_path`: Path to the GraphQL schema file
- `user_pool_id`: Cognito User Pool ID

## Outputs

- `graphql_api_id`: (no description)
- `graphql_api_url`: (no description)
- `api_key`: (no description)
- `authentication_type`: Authentication type used by the AppSync GraphQL API
