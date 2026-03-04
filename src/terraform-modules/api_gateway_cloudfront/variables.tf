variable "env" {
  description = "Environment name (for example staging or production)."
  type        = string
}

variable "region" {
  description = "Region label used for naming (for example AU, NZ)."
  type        = string
}

variable "domain" {
  description = "Base domain used for the API alias."
  type        = string
}

variable "project" {
  description = "Project identifier used in resource naming."
  type        = string
}

variable "certificate_arn_regional" {
  description = "Regional ACM certificate ARN for the API Gateway custom domain."
  type        = string
}

variable "certificate_arn_us_east_1" {
  description = "us-east-1 ACM certificate ARN for the CloudFront distribution."
  type        = string
}

variable "api_id" {
  description = "API Gateway ID."
  type        = string
}

variable "api_stage" {
  description = "API Gateway stage name."
  type        = string
}
