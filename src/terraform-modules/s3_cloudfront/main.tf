# module "s3_cloudfront_production_au" {
#   source  = "./modules/s3_cloudfront"
#   env     = "production"
#   region  = "au"
#   domain  = var.DOMAIN_AU
#   project = var.PROJECT
#   bucket = "${var.PROJECT_KEBAB}-production-au"
#   acm_certificate_arn = ""
# }


locals {
  env_lowercased  = lower(var.env)
  env_capitalized = "${upper(substr(var.env, 0, 1))}${substr(var.env, 1, -1)}"
  region_upper    = upper(var.region)
}

resource "aws_s3_bucket" "s3_bucket" {
  bucket = var.bucket
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_website_configuration" "s3_bucket_website" {
  bucket = aws_s3_bucket.s3_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "disable_bpa" {
  bucket = aws_s3_bucket.s3_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_read_access" {
  bucket = aws_s3_bucket.s3_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "PublicRead",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.s3_bucket.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.disable_bpa]
}

resource "aws_cloudfront_distribution" "website_distribution" {
  enabled             = true
  comment             = "Distribution for ${var.project} Website ${local.env_capitalized} ${local.region_upper}"
  default_root_object = "index.html"

  aliases = var.domain != "" ? [var.domain] : []

  # Provide the ACM certificate from us-east-1
  viewer_certificate {
    cloudfront_default_certificate = var.domain == "" ? true : false
    acm_certificate_arn            = var.domain != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.domain != "" ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }


  origin {
    # domain_name = aws_s3_bucket_website_configuration.s3_bucket_website.website_endpoint
    domain_name = "${var.bucket}.s3-website-${var.region}.amazonaws.com"
    origin_id   = "${var.project}Origin"
    custom_origin_config {
      origin_protocol_policy = "http-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "${var.project}Origin"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    origin_request_policy_id   = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
  }

  custom_error_response {
    error_code            = 404
    response_page_path    = "/200.html"
    response_code         = 200
    error_caching_min_ttl = 10
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [origin]
  }
}
