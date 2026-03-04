resource "aws_s3_bucket" "s3_bucket" {
  bucket        = var.bucket
  force_destroy = var.force_destroy

  lifecycle {
    prevent_destroy = false
  }
}

# Enforce private access - block all public access settings
resource "aws_s3_bucket_public_access_block" "block_public_access" {
  bucket = aws_s3_bucket.s3_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Recommended modern ownership controls (disables ACLs)
resource "aws_s3_bucket_ownership_controls" "ownership" {
  bucket = aws_s3_bucket.s3_bucket.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Optional: create an IAM user + access keys for credential-based access
locals {
  effective_iam_user_name = var.iam_user_name != "" ? var.iam_user_name : "${var.bucket}-catalogue-access"
}

resource "aws_iam_user" "bucket_user" {
  count = var.create_access_credentials ? 1 : 0
  name  = local.effective_iam_user_name
}

data "aws_iam_policy_document" "bucket_access" {
  count = var.create_access_credentials ? 1 : 0

  statement {
    sid     = "BucketLevel"
    effect  = "Allow"
    actions = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = [
      aws_s3_bucket.s3_bucket.arn
    ]
  }

  statement {
    sid     = "ObjectLevel"
    effect  = "Allow"
    actions = var.allowed_actions
    resources = [
      "${aws_s3_bucket.s3_bucket.arn}/*"
    ]
  }
}

resource "aws_iam_policy" "bucket_policy" {
  count  = var.create_access_credentials ? 1 : 0
  name   = "${local.effective_iam_user_name}-policy"
  policy = data.aws_iam_policy_document.bucket_access[0].json
}

resource "aws_iam_user_policy_attachment" "bucket_attach" {
  count      = var.create_access_credentials ? 1 : 0
  user       = aws_iam_user.bucket_user[0].name
  policy_arn = aws_iam_policy.bucket_policy[0].arn
}

resource "aws_iam_access_key" "bucket_user_key" {
  count = var.create_access_credentials ? 1 : 0
  user  = aws_iam_user.bucket_user[0].name
}
