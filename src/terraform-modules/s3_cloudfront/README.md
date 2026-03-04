# s3_cloudfront

## Usage

```hcl
module "s3_cloudfront" {
  source = "../../modules/s3_cloudfront"
  # ...
}
```

## Inputs

- `env`: Environment name (for example staging or production).
- `region`: AWS region identifier used for naming.
- `domain`: Custom domain name for the CloudFront alias (empty string to skip).
- `project`: Project identifier used in resource naming.
- `bucket`: S3 bucket name for website hosting.
- `acm_certificate_arn`: us-east-1 ACM certificate ARN used when domain is provided.

## Outputs

- `s3_bucket_name`: (no description)
- `s3_bucket_arn`: (no description)
- `s3_website_url`: (no description)
- `cloudfront_distribution_id`: (no description)
- `cloudfront_domain_name`: (no description)
