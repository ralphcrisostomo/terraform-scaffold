output "api_gateway_id" {
  value = aws_apigatewayv2_api.http_api.id
}

output "api_gateway_endpoint" {
  description = "The default endpoint of the API Gateway."
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "api_stage_name" {
  value = aws_apigatewayv2_stage.default_stage.name
}

output "api_execution_arn" {
  value = aws_apigatewayv2_api.http_api.execution_arn
}
