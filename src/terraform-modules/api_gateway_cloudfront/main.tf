# modules/api_gateway_cloudfront/main.tf
#
# module "api_gateway_cloudfront_au" {
#   source = "./modules/api_gateway_cloudfront"
#   env                       = "Production"
#   region                    = "AU"
#   domain                    = var.DOMAIN_AU
#   project                   = var.PROJECT
#   certificate_arn_regional  = module.acm_sydney_au.certificate_arn
#   certificate_arn_us_east_1 = module.acm_virginia_au.certificate_arn
#
#   api_id               = module.lambda_api_gateway.api_gateway_id
#   api_stage            = module.lambda_api_gateway.api_stage_name
# }
#
# module "api_gateway_cloudfront_nz" {
#   source = "./modules/api_gateway_cloudfront"
#   env                       = "Production"
#   region                    = "NZ"
#   domain                    = var.DOMAIN_NZ
#   project                   = var.PROJECT
#   certificate_arn_regional  = module.acm_sydney_nz.certificate_arn
#   certificate_arn_us_east_1 = module.acm_virginia_nz.certificate_arn
#
#   api_id               = module.lambda_api_gateway.api_gateway_id
#   api_stage            = module.lambda_api_gateway.api_stage_name
# }




locals {
  env_lowercased   = lower(var.env)
  env_capitalized  = "${upper(substr(var.env, 0, 1))}${substr(var.env, 1, -1)}"
  cloudfront_alias = local.env_lowercased == "staging" ? "staging.api.${var.domain}" : "api.${var.domain}"
}


resource "aws_apigatewayv2_domain_name" "custom_domain" {
  domain_name = local.cloudfront_alias
  domain_name_configuration {
    certificate_arn = var.certificate_arn_regional
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "api_mapping" {
  api_id      = var.api_id
  domain_name = aws_apigatewayv2_domain_name.custom_domain.domain_name
  stage       = var.api_stage
}

resource "aws_cloudfront_distribution" "api_distribution" {
  enabled             = true
  comment             = "Distribution for ${var.project} API ${local.env_capitalized} ${var.region}"
  default_root_object = ""

  # TODO: Need to update goDaddy to map api.plumber.app.puretecgroup.com to du3co35cjwzys.cloudfront.net
  aliases = [local.cloudfront_alias]

  origin {
    domain_name = aws_apigatewayv2_domain_name.custom_domain.domain_name_configuration[0].target_domain_name
    origin_id   = "APIGatewayOrigin"

    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "APIGatewayOrigin"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn_us_east_1
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}
