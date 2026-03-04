# cognito_user_pool_client

## Usage

```hcl
module "cognito_user_pool_client" {
  source = "../../modules/cognito_user_pool_client"
  # ...
}
```

## Inputs

- `project`: Project name used for naming the User Pool Client
- `user_pool_id`: ID of the Cognito User Pool
- `callback_urls`: List of allowed callback URLs for OAuth
- `logout_urls`: List of allowed logout URLs for OAuth
- `access_token_validity`: Access token validity in minutes
- `id_token_validity`: ID token validity in minutes
- `refresh_token_validity`: Refresh token validity in minutes

## Outputs

- `user_pool_client_id`: The ID of the Cognito User Pool Client
