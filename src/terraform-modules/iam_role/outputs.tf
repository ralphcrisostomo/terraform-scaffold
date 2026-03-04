output "lambda_role_arn" {
  value = aws_iam_role.lambda_role.arn
}

output "lambda_role_name" {
  value = aws_iam_role.lambda_role.name
}

output "appsync_role_arn" {
  value = aws_iam_role.appsync_role.arn
}
