# module "route_53_api" {
#   source               = "./modules/route_53"
#   zone_name            = "example.com"
#   record_name          = "staging.api.example.com"
#   target_domain_name   = "d111111abcdef8.cloudfront.net"
#   target_hosted_zone_id = "Z2FDTNDATAQYW2"
# }


data "aws_route53_zone" "zone" {
  name         = var.zone_name
  private_zone = false
}

resource "aws_route53_record" "alias_a" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.record_name
  type    = "A"

  alias {
    name                   = var.target_domain_name
    zone_id                = var.target_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "alias_aaaa" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.record_name
  type    = "AAAA"

  alias {
    name                   = var.target_domain_name
    zone_id                = var.target_hosted_zone_id
    evaluate_target_health = false
  }
}
