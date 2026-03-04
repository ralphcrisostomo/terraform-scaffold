locals {
  alerts_are_active    = var.enabled && (length(var.email_addresses) + length(var.sns_topic_arns) > 0)
  unique_service_names = toset(var.service_names)
}

resource "aws_budgets_budget" "total" {
  count = local.alerts_are_active && var.include_total_budget ? 1 : 0

  account_id   = var.account_id
  name         = "${var.name_prefix}-total-monthly-cost"
  budget_type  = "COST"
  limit_amount = tostring(var.limit_amount_usd)
  limit_unit   = "USD"
  time_unit    = var.time_unit

  dynamic "notification" {
    for_each = var.notification_types
    content {
      comparison_operator        = "GREATER_THAN"
      notification_type          = notification.value
      threshold                  = var.threshold_percentage
      threshold_type             = "PERCENTAGE"
      subscriber_email_addresses = var.email_addresses
      subscriber_sns_topic_arns  = var.sns_topic_arns
    }
  }
}

resource "aws_budgets_budget" "per_service" {
  for_each = local.alerts_are_active && var.include_service_budgets ? local.unique_service_names : toset([])

  account_id   = var.account_id
  name         = "${var.name_prefix}-${substr(md5(each.value), 0, 8)}-service-monthly-cost"
  budget_type  = "COST"
  limit_amount = tostring(var.limit_amount_usd)
  limit_unit   = "USD"
  time_unit    = var.time_unit

  cost_filter {
    name   = "Service"
    values = [each.value]
  }

  dynamic "notification" {
    for_each = var.notification_types
    content {
      comparison_operator        = "GREATER_THAN"
      notification_type          = notification.value
      threshold                  = var.threshold_percentage
      threshold_type             = "PERCENTAGE"
      subscriber_email_addresses = var.email_addresses
      subscriber_sns_topic_arns  = var.sns_topic_arns
    }
  }
}
