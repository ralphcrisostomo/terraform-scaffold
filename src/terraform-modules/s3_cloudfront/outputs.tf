output "s3_bucket_name" {
  value = aws_s3_bucket.s3_bucket.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.s3_bucket.arn
}

output "s3_website_url" {
  value = aws_s3_bucket_website_configuration.s3_bucket_website.website_endpoint
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.website_distribution.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.website_distribution.domain_name
}
