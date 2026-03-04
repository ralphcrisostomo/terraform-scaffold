# s3_private_storage

## Usage

```hcl
module "s3_private_storage" {
  source = "../../modules/s3_private_storage"
  # ...
}
```

## Inputs

- `bucket`: Name of the S3 bucket to create.
- `force_destroy`: Whether to allow the bucket to be destroyed even if it contains objects.
- `create_access_credentials`: If true, create an IAM user with an access key/secret to access this bucket.
- `iam_user_name`: IAM user name to create for bucket access when create_access_credentials is true. If empty, a name based on the bucket will be used.
- `allowed_actions`: S3 actions to allow for the credentialed IAM user when create_access_credentials is true.

## Outputs

- `s3_bucket_name`: (no description)
- `s3_bucket_arn`: (no description)
- `s3_bucket_url`: (no description)
- `access_key_id`: Access key id for the IAM user (only when create_access_credentials is true).
- `secret_access_key`: Secret access key for the IAM user (only when create_access_credentials is true). Treat as sensitive.
