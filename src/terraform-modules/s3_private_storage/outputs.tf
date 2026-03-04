output "s3_bucket_name" {
  value = aws_s3_bucket.s3_bucket.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.s3_bucket.arn
}

output "s3_bucket_url" {
  value = "https://${aws_s3_bucket.s3_bucket.bucket}.s3.amazonaws.com"
}

output "access_key_id" {
  description = "Access key id for the IAM user (only when create_access_credentials is true)."
  value       = var.create_access_credentials ? aws_iam_access_key.bucket_user_key[0].id : null
}

output "secret_access_key" {
  description = "Secret access key for the IAM user (only when create_access_credentials is true). Treat as sensitive."
  value       = var.create_access_credentials ? aws_iam_access_key.bucket_user_key[0].secret : null
  sensitive   = true
}
