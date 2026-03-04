output "s3_bucket_name" {
  value = aws_s3_bucket.s3_bucket.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.s3_bucket.arn
}

output "s3_bucket_url" {
  value = "https://${aws_s3_bucket.s3_bucket.bucket}.s3.amazonaws.com"
}
