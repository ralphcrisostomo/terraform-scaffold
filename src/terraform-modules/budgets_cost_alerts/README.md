# budgets_cost_alerts

## Usage

```hcl
module "budgets_cost_alerts" {
  source = "../../modules/budgets_cost_alerts"
  # ...
}
```

## Inputs

- `enabled`: Whether to create AWS Budgets resources.
- `account_id`: AWS account ID for the budget. If null, the current caller account is used.
- `name_prefix`: Prefix used for budget names.
- `limit_amount_usd`: Monthly budget amount in USD.
- `time_unit`: Budget time unit.
- `threshold_percentage`: Budget alert threshold percentage.
- `notification_types`: Budget notification types to create.
- `email_addresses`: Email recipients for cost alerts.
- `sns_topic_arns`: SNS topic ARNs for cost alerts.
- `service_names`: AWS service names (Cost Explorer dimension values) for per-service budgets.
- `include_total_budget`: Whether to create a total account budget in addition to per-service budgets.
- `include_service_budgets`: Whether to create per-service budgets.

## Outputs

- `alerts_are_active`: Whether alerts are active. Alerts require enabled=true and at least one email or SNS subscriber.
- `total_budget_name`: Total monthly budget name.
- `service_budget_names`: Map of service name to created budget name.
