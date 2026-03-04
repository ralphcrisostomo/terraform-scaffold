output "graphql_api_id" {
  value = aws_appsync_graphql_api.api.id
}

output "graphql_api_url" {
  value = aws_appsync_graphql_api.api.uris["GRAPHQL"]
}

output "api_key" {
  value     = aws_appsync_api_key.api_key.key
  sensitive = true
}

output "authentication_type" {
  description = "Authentication type used by the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.api.authentication_type
}
