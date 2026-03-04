output "certificate_arn" {
  value = aws_acm_certificate.cert.arn
}

output "domain_name" {
  value = aws_acm_certificate.cert.domain_name
}

output "subject_alternative_names" {
  value = aws_acm_certificate.cert.subject_alternative_names
}

output "domain_validation_options" {
  value       = aws_acm_certificate.cert.domain_validation_options
  description = "Contains CNAME records needed for DNS validation."
}
