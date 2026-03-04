variable "lambda_function_name" {
  description = "Lambda function name."
  type        = string
}

variable "zip_path" {
  description = "Path to the deployment package zip."
  type        = string
}

variable "handler" {
  description = "Lambda handler (for example index.handler)."
  type        = string
}

variable "runtime" {
  default = "nodejs20.x"
}

variable "timeout" {
  default = 300
}

variable "memory_size" {
  default = 512
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "layers" {
  type    = list(string)
  default = []
}

variable "lambda_role_arn" {
  description = "IAM Role ARN to assign to Lambda"
  type        = string
}
