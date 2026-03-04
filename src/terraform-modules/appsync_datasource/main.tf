resource "aws_appsync_datasource" "datasource" {
  api_id = var.api_id
  name   = var.table_name != "" ? "${var.table_name}DataSource" : "${replace(var.lambda_arn, "/.*:/", "")}DataSource"
  type   = var.table_name != "" ? "AMAZON_DYNAMODB" : "AWS_LAMBDA"

  dynamic "dynamodb_config" {
    for_each = var.table_name != "" ? [1] : []
    content {
      table_name = var.table_name
    }
  }

  dynamic "lambda_config" {
    for_each = var.lambda_arn != "" ? [1] : []
    content {
      function_arn = var.lambda_arn
    }
  }

  service_role_arn = var.service_role_arn
}
