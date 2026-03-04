# s3_public_storage

## Usage

```hcl
module "s3_public_storage" {
  source = "../../modules/s3_public_storage"
  # ...
}
```

## Inputs

- `bucket`: Name of the public S3 bucket.

## Outputs

- `s3_bucket_name`: (no description)
- `s3_bucket_arn`: (no description)
- `s3_bucket_url`: (no description)
