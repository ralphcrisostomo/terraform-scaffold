# cognito_user_pool

## Usage

```hcl
module "cognito_user_pool" {
  source = "../../modules/cognito_user_pool"
  # ...
}
```

## Inputs

- `project`: Project name used for naming the User Pool
- `from_email_address`: The 'From' email address used for Cognito emails (must match SES-verified identity)
- `ses_identity_arn`: SES verified domain or email identity ARN for sending emails
- `pre_signup_lambda_arn`: ARN of the Lambda used for pre sign-up trigger
- `custom_message_lambda_arn`: Lambda ARN for CustomMessage trigger
- `post_confirmation_lambda_arn`: Lambda ARN for PostConfirmation trigger
- `custom_schema`: Custom schema attributes for Cognito User Pool

## Outputs

- `user_pool_id`: The ID of the Cognito User Pool
- `user_pool_arn`: The ARN of the Cognito User Pool
