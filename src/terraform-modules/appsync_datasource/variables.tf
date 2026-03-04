variable "api_id" {
  description = "AppSync API ID"
  type        = string
}

variable "table_name" {
  description = "DynamoDB table name (leave empty if not using DynamoDB)"
  type        = string
  default     = ""
}

variable "lambda_arn" {
  description = "Lambda function ARN (leave empty if not using Lambda)"
  type        = string
  default     = ""
}

variable "service_role_arn" {
  description = "IAM Role ARN AppSync will use"
  type        = string
}
