output "config" {
  value = {
    AWS_APPSYNC_TEMP_API_KEY                = module.appsync.api_key,
    AWS_APPSYNC_GRAPHQL_ENDPOINT            = module.appsync.graphql_api_url,
    AWS_APPSYNC_DEFAULT_AUTHENTICATION_TYPE = module.appsync.authentication_type,
    AWS_REGION                              = var.AWS_REGION,
    AWS_COGNITO_USER_POOL_ID                = module.cognito_user_pool.user_pool_id,
    AWS_COGNITO_USER_POOL_CLIENT_ID         = module.cognito_user_pool_client.user_pool_client_id,
  }
  description = "The configuration values for the AppSync API"
  sensitive   = true
}
