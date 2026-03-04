variable "name" {
  description = "Name of the IAM role to create"
  type        = string
}

variable "lambda_dynamodb_table_arns" {
  type    = list(string)
  default = []
}

variable "appsync_dynamodb_table_arns" {
  type    = list(string)
  default = []
}

variable "s3_bucket_arns" {
  type    = list(string)
  default = []
}

variable "ses_identity_arns" {
  type    = list(string)
  default = []
}

variable "cognito_user_pool_arns" {
  type    = list(string)
  default = []
}

variable "lambda_arns" {
  type    = list(string)
  default = []
}

variable "sns_platform_application_arns" {
  type    = list(string)
  default = []
}
