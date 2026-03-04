variable "project" {
  description = "Project name used for naming the User Pool"
  type        = string
}

variable "from_email_address" {
  description = "The 'From' email address used for Cognito emails (must match SES-verified identity)"
  type        = string
}

variable "ses_identity_arn" {
  description = "SES verified domain or email identity ARN for sending emails"
  type        = string
}

variable "pre_signup_lambda_arn" {
  description = "ARN of the Lambda used for pre sign-up trigger"
  type        = string
}

variable "custom_message_lambda_arn" {
  type        = string
  description = "Lambda ARN for CustomMessage trigger"
}

variable "post_confirmation_lambda_arn" {
  type        = string
  description = "Lambda ARN for PostConfirmation trigger"
}

variable "custom_schema" {
  description = "Custom schema attributes for Cognito User Pool"
  type = list(object({
    name     = string
    type     = string
    mutable  = bool
    required = bool
  }))
  default = []
}
