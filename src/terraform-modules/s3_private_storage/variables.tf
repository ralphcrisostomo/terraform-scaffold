variable "bucket" {
  type        = string
  description = "Name of the S3 bucket to create."
}

variable "force_destroy" {
  type        = bool
  description = "Whether to allow the bucket to be destroyed even if it contains objects."
  default     = false
}

variable "create_access_credentials" {
  type        = bool
  description = "If true, create an IAM user with an access key/secret to access this bucket."
  default     = true
}

variable "iam_user_name" {
  type        = string
  description = "IAM user name to create for bucket access when create_access_credentials is true. If empty, a name based on the bucket will be used."
  default     = ""
}

variable "allowed_actions" {
  type        = list(string)
  description = "S3 actions to allow for the credentialed IAM user when create_access_credentials is true."
  default = [
    "s3:ListBucket",
    "s3:GetBucketLocation",
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject"
  ]
}
