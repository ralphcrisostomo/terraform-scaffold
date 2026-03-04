variable "enabled" {
  description = "Whether to create AWS Budgets resources."
  type        = bool
  default     = true
}

variable "account_id" {
  description = "AWS account ID for the budget. If null, the current caller account is used."
  type        = string
  default     = null
}

variable "name_prefix" {
  description = "Prefix used for budget names."
  type        = string
}

variable "limit_amount_usd" {
  description = "Monthly budget amount in USD."
  type        = number
  default     = 100

  validation {
    condition     = var.limit_amount_usd > 0
    error_message = "The limit_amount_usd value must be greater than 0."
  }
}

variable "time_unit" {
  description = "Budget time unit."
  type        = string
  default     = "MONTHLY"

  validation {
    condition     = contains(["DAILY", "MONTHLY", "QUARTERLY", "ANNUALLY"], var.time_unit)
    error_message = "The time_unit value must be one of DAILY, MONTHLY, QUARTERLY, or ANNUALLY."
  }
}

variable "threshold_percentage" {
  description = "Budget alert threshold percentage."
  type        = number
  default     = 100

  validation {
    condition     = var.threshold_percentage > 0
    error_message = "The threshold_percentage value must be greater than 0."
  }
}

variable "notification_types" {
  description = "Budget notification types to create."
  type        = set(string)
  default     = ["ACTUAL", "FORECASTED"]

  validation {
    condition = alltrue([
      for notification_type in var.notification_types :
      contains(["ACTUAL", "FORECASTED"], notification_type)
    ])
    error_message = "The notification_types value can only contain ACTUAL and/or FORECASTED."
  }
}

variable "email_addresses" {
  description = "Email recipients for cost alerts."
  type        = list(string)
  default     = []
}

variable "sns_topic_arns" {
  description = "SNS topic ARNs for cost alerts."
  type        = list(string)
  default     = []
}

variable "service_names" {
  description = "AWS service names (Cost Explorer dimension values) for per-service budgets."
  type        = list(string)
  default     = []
}

variable "include_total_budget" {
  description = "Whether to create a total account budget in addition to per-service budgets."
  type        = bool
  default     = true
}

variable "include_service_budgets" {
  description = "Whether to create per-service budgets."
  type        = bool
  default     = true
}
