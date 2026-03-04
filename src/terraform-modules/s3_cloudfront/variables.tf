variable "env" {
  description = "Environment name (for example staging or production)."
  type        = string
}

variable "region" {
  description = "AWS region identifier used for naming."
  type        = string
}

variable "domain" {
  description = "Custom domain name for the CloudFront alias (empty string to skip)."
  type        = string
}

variable "project" {
  description = "Project identifier used in resource naming."
  type        = string
}

variable "bucket" {
  description = "S3 bucket name for website hosting."
  type        = string
}

variable "acm_certificate_arn" {
  description = "us-east-1 ACM certificate ARN used when domain is provided."
  type        = string
}
