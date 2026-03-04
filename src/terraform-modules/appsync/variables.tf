variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "schema_path" {
  description = "Path to the GraphQL schema file"
  type        = string
  default     = "schema.graphql"
}

variable "user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}
