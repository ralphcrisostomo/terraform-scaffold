variable "ENV" {
  type = string
}

variable "PROJECT" {
  type = string
}

variable "PROJECT_ENV" {
  type = string
}

variable "PROJECT_ENV_KEBAB" {
  type = string
}

variable "PROJECT_KEBAB" {
  type = string
}

variable "AWS_REGION" {
  type = string
}

variable "AWS_ACCOUNT_ID" {
  type = string
}

variable "DOMAIN" {
  type = string
}

variable "DOMAIN_ONLY" {
  type = string
}

variable "DOMAIN_CERT" {
  type = string
}

variable "NETSUITE_REALM" {
  type    = string
  default = ""
}

variable "NETSUITE_CONSUMER_KEY" {
  type    = string
  default = ""
}

variable "NETSUITE_CONSUMER_SECRET" {
  type    = string
  default = ""
}

variable "NETSUITE_TOKEN_ID" {
  type    = string
  default = ""
}

variable "NETSUITE_TOKEN_SECRET" {
  type    = string
  default = ""
}

variable "AWS_ACCESS_KEY_ID" {
  type    = string
  default = ""
}

variable "AWS_SECRET_ACCESS_KEY" {
  type    = string
  default = ""
}

variable "STRIPE_API_KEY_AU" {
  type    = string
  default = ""
}

variable "STRIPE_API_KEY_NZ" {
  type    = string
  default = ""
}

variable "GCP_PROJECT_ID" {
  type    = string
  default = ""
}

variable "GCP_REGION" {
  type    = string
  default = ""
}

variable "GCP_CREDENTIALS_FILE" {
  type        = string
  description = "Path to the GCP service account JSON credentials file."
  default     = ""
}

variable "PACKAGE_NAME" {
  type    = string
  default = ""
}

variable "COST_ALERT_ENABLED" {
  type    = bool
  default = true
}

variable "COST_ALERT_LIMIT_USD" {
  type    = number
  default = 50
}

variable "COST_ALERT_INCLUDE_TOTAL" {
  type    = bool
  default = true
}

variable "COST_ALERT_INCLUDE_PER_SERVICE" {
  type    = bool
  default = true
}

variable "COST_ALERT_EMAIL_ADDRESSES" {
  type    = list(string)
  default = []
}

variable "COST_ALERT_SNS_TOPIC_ARNS" {
  type    = list(string)
  default = []
}

variable "COST_ALERT_SERVICES" {
  type = list(string)
  default = [
    "Amazon API Gateway",
    "Amazon CloudFront",
    "Amazon Cognito",
    "Amazon DynamoDB",
    "Amazon Route 53",
    "Amazon Simple Email Service",
    "Amazon Simple Notification Service",
    "Amazon Simple Storage Service",
    "AWS AppSync",
    "AWS Certificate Manager",
    "AWS Lambda",
  ]
}
