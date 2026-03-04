variable "region" {
  description = "Region label used for naming and tags."
  type        = string
}

variable "domain" {
  description = "Base domain for the certificate."
  type        = string
}

variable "prefixes" {
  description = "List of SAN prefixes (e.g., [\"api\", \"staging\", \"staging.api\"])."
  type        = list(string)
  default     = ["api", "staging", "staging.api"]
}

variable "validation_method" {
  type    = string
  default = "DNS"
}

variable "tags" {
  type    = map(string)
  default = {}
}
