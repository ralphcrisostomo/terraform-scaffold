# api_gateway_cloudfront

## Usage

```hcl
module "api_gateway_cloudfront" {
  source = "../../modules/api_gateway_cloudfront"
  # ...
}
```

## Inputs

- `env`: Environment name (for example staging or production).
- `region`: Region label used for naming (for example AU, NZ).
- `domain`: Base domain used for the API alias.
- `project`: Project identifier used in resource naming.
- `certificate_arn_regional`: Regional ACM certificate ARN for the API Gateway custom domain.
- `certificate_arn_us_east_1`: us-east-1 ACM certificate ARN for the CloudFront distribution.
- `api_id`: API Gateway ID.
- `api_stage`: API Gateway stage name.

## Outputs

- `custom_domain_name`: (no description)
- `api_gateway_target_domain`: (no description)
- `cloudfront_distribution_id`: (no description)
- `cloudfront_domain_name`: (no description)
- `cloudfront_hosted_zone_id`: (no description)
