resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.project}UserPool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"

  email_configuration {
    email_sending_account = "DEVELOPER"
    from_email_address    = var.from_email_address
    source_arn            = var.ses_identity_arn
  }

  dynamic "schema" {
    for_each = var.custom_schema
    content {
      name                = schema.value.name
      attribute_data_type = schema.value.type
      mutable             = schema.value.mutable
      required            = schema.value.required
    }
  }

  # Note: Temporary comment this up when having new schema!
  # Note: Destroy current user pool:
  #   - terraform destroy -target=module.cognito_user_pool
  lifecycle {
    ignore_changes = [schema]
  }

  lambda_config {
    pre_sign_up       = var.pre_signup_lambda_arn
    custom_message    = var.custom_message_lambda_arn
    post_confirmation = var.post_confirmation_lambda_arn
  }
}
