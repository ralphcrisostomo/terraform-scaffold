variable "zone_name" {
  description = "Route 53 hosted zone name (for example example.com)."
  type        = string
}

variable "record_name" {
  description = "DNS record name to create."
  type        = string
}

variable "target_domain_name" {
  description = "Target domain name for the alias record."
  type        = string
}

variable "target_hosted_zone_id" {
  description = "Hosted zone ID for the alias target."
  type        = string
}
