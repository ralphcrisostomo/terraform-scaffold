variable "api_name" {
  description = "Name of the API Gateway API"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name"
  type        = string
}

variable "lambda_function_arn" {
  description = "Lambda function ARN"
  type        = string
}

variable "integration_timeout_milliseconds" {
  description = "Timeout for Lambda integration (50-30000 ms)."
  type        = number
  default     = 29000
}
