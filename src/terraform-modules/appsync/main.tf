resource "aws_appsync_graphql_api" "api" {
  name                = "${var.project}API"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  user_pool_config {
    user_pool_id   = var.user_pool_id
    aws_region     = var.aws_region
    default_action = "ALLOW"
  }

  schema = file(var.schema_path)
}

resource "aws_appsync_api_key" "api_key" {
  api_id      = aws_appsync_graphql_api.api.id
  description = "API Key for ${var.project}API"
  expires     = "2027-01-01T00:00:00Z"
}

# resource "aws_iam_role" "dynamo_role" {
#   name = "${var.project}AppSyncDynamoRole"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [{
#       Effect    = "Allow",
#       Action    = "sts:AssumeRole",
#       Principal = { Service = "appsync.amazonaws.com" }
#     }]
#   })
# }
#
# resource "aws_iam_role_policy" "invoke_lambda_policy" {
#   count = length(var.lambda_arns) > 0 ? 1 : 0
#
#   name = "inline-lambda-invoke-${var.project}"
#   role = aws_iam_role.dynamo_role.id
#
#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Sid    = "AllowInvokeLambda",
#         Effect = "Allow",
#         Action = [
#           "lambda:InvokeFunction"
#         ],
#         Resource = var.lambda_arns
#       }
#     ]
#   })
# }
#
# resource "aws_iam_role_policy_attachment" "dynamo_policy" {
#   role       = aws_iam_role.dynamo_role.name
#   policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
# }
