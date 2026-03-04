# modules/acm_certificates/main.tf

# Usage Example:
# module "acm_sydney_au" {
#   source    = "./modules/acm_certificates"
#   region    = "sydney"
#   domain    = var.DOMAIN_AU
#   providers = {
#     aws = aws.sydney
#   }
#   tags = {
#     Environment = "production"
#     Region      = "au"
#   }
# }
#
# module "acm_virginia_au" {
#   source    = "./modules/acm_certificates"
#   region    = "virginia"
#   domain    = var.DOMAIN_AU
#   providers = {
#     aws = aws.virginia
#   }
#   tags = {
#     Environment = "production"
#     Region      = "au"
#   }
# }





resource "aws_acm_certificate" "cert" {
  provider = aws

  domain_name = var.domain
  subject_alternative_names = [
    for prefix in var.prefixes : "${prefix}.${var.domain}"
  ]
  validation_method = var.validation_method
  tags              = var.tags

  lifecycle {
    prevent_destroy = true
  }
}
