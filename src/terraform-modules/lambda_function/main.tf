# modules/lambda_function/main.tf




resource "aws_lambda_function" "lambda" {
  filename         = var.zip_path
  function_name    = var.lambda_function_name
  role             = var.lambda_role_arn
  handler          = var.handler
  runtime          = var.runtime
  source_code_hash = filebase64sha256(var.zip_path)
  timeout          = var.timeout
  memory_size      = var.memory_size
  kms_key_arn      = null
  layers           = var.layers

  environment {
    variables = var.environment_variables
  }
}
