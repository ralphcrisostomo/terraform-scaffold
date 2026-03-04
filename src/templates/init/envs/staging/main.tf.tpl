provider "aws" {
  region = var.AWS_REGION
}

provider "google" {
  project     = var.GCP_PROJECT_ID
  region      = var.GCP_REGION
  credentials = var.GCP_CREDENTIALS_FILE != "" ? file(var.GCP_CREDENTIALS_FILE) : null
}

provider "google-beta" {
  project     = var.GCP_PROJECT_ID
  region      = var.GCP_REGION
  credentials = var.GCP_CREDENTIALS_FILE != "" ? file(var.GCP_CREDENTIALS_FILE) : null
}

data "aws_caller_identity" "current" {}

terraform {
  backend "s3" {}
}
