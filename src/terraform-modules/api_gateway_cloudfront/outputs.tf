output "custom_domain_name" {
  value = aws_apigatewayv2_domain_name.custom_domain.domain_name
}

output "api_gateway_target_domain" {
  value = aws_apigatewayv2_domain_name.custom_domain.domain_name_configuration[0].target_domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.api_distribution.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.api_distribution.domain_name
}

output "cloudfront_hosted_zone_id" {
  value = aws_cloudfront_distribution.api_distribution.hosted_zone_id
}
