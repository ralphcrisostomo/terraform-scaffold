output "alerts_are_active" {
  description = "Whether alerts are active. Alerts require enabled=true and at least one email or SNS subscriber."
  value       = local.alerts_are_active
}

output "total_budget_name" {
  description = "Total monthly budget name."
  value       = try(aws_budgets_budget.total[0].name, null)
}

output "service_budget_names" {
  description = "Map of service name to created budget name."
  value = {
    for service_name, budget in aws_budgets_budget.per_service :
    service_name => budget.name
  }
}
