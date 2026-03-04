# terraform/modules/lambda_iam_role/main.tf








resource "aws_iam_role" "appsync_role" {
  name = "${var.name}AppSyncRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Action    = "sts:AssumeRole",
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}



resource "aws_iam_role" "lambda_role" {
  name = var.name

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = ""
      }
    ]
  })
}

resource "aws_iam_role_policy" "invoke_lambda_policy" {
  count = length(var.lambda_arns) > 0 ? 1 : 0

  name = "inline-lambda-${var.name}-appsync"
  role = aws_iam_role.appsync_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowInvokeLambda",
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = var.lambda_arns
      }
    ]
  })
}

resource "aws_iam_role_policy" "cognito_inline_policy" {
  count = length(var.cognito_user_pool_arns) > 0 ? 1 : 0

  name = "inline-cognito-${var.name}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid : "AllowCognitoUpdateAttributes",
        Effect : "Allow",
        Action : [
          "cognito-idp:AdminUpdateUserAttributes"
        ],
        Resource = var.cognito_user_pool_arns
      }
    ]
  })
}


# Inline DynamoDB Policy
resource "aws_iam_role_policy" "dynamodb_inline_policy" {
  count = length(var.lambda_dynamodb_table_arns) > 0 ? 1 : 0
  name  = "inline-dynamodb-${var.name}-lambda"
  role  = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid : "AllowDynamoDBActions",
        Effect : "Allow",
        Action : [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem"
        ],
        Resource = var.lambda_dynamodb_table_arns
      }
    ]
  })
}

resource "aws_iam_role_policy" "dynamodb_inline_policy_appsync" {
  count = length(var.appsync_dynamodb_table_arns) > 0 ? 1 : 0

  name = "inline-dynamodb-${var.name}-appsync"
  role = aws_iam_role.appsync_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowDynamoDBAccessIncludingIndexes",
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem"
        ],
        Resource = var.appsync_dynamodb_table_arns,
      }
    ]
  })
}


# Inline S3 Policy
resource "aws_iam_role_policy" "s3_inline_policy" {
  count = length(var.s3_bucket_arns) > 0 ? 1 : 0

  name = "inline-s3-${var.name}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowS3ListBucket",
        Effect = "Allow",
        Action = [
          "s3:ListBucket"
        ],
        Resource = var.s3_bucket_arns
      },
      {
        Sid    = "AllowS3ObjectReadWrite",
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ],
        Resource = [for bucket_arn in var.s3_bucket_arns : "${bucket_arn}/*"]
      }
    ]
  })
}

# Inline SES Policy
resource "aws_iam_role_policy" "ses_inline_policy" {
  count = length(var.ses_identity_arns) > 0 ? 1 : 0

  name = "inline-ses-${var.name}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid : "AllowSESSendEmail",
        Effect : "Allow",
        Action : ["ses:SendEmail", "ses:SendRawEmail"],
        Resource = var.ses_identity_arns
      }
    ]
  })
}

# Inline SNS Policy
resource "aws_iam_role_policy" "sns_inline_policy" {
  count = length(var.sns_platform_application_arns) > 0 ? 1 : 0

  name = "inline-sns-${var.name}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowSNSPlatformOperations",
        Effect = "Allow",
        Action = [
          "sns:Publish",
          "sns:CreatePlatformEndpoint",
          "sns:SetEndpointAttributes"
        ],
        Resource = var.sns_platform_application_arns
      }
    ]
  })
}

# resource "aws_iam_role_policy_attachment" "dynamo_policy" {
#   role       = aws_iam_role.appsync_role.name
#   policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
# }

# AWS Managed Policy: Lambda Basic Execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
