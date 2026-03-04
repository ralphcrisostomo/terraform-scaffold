variable "project_name" {
  description = "Project identifier used in names and tags."
  type        = string
}

variable "environment" {
  description = "Environment name."
  type        = string
}

variable "aws_region" {
  description = "AWS region for this environment."
  type        = string
  default     = "{{AWS_REGION}}"
}

variable "tags" {
  description = "Additional tags to apply to managed resources."
  type        = map(string)
  default     = {}
}
