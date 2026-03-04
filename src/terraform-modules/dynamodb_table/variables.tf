variable "name" {
  type = string
}

variable "hash_key" {
  type = string
}

variable "range_key" {
  type    = string
  default = ""
}

variable "attributes" {
  type = list(object({
    name = string
    type = string
  }))
}

variable "global_secondary_indexes" {
  type = list(object({
    name               = string
    hash_key           = string
    range_key          = string # not optional
    projection_type    = string
    non_key_attributes = list(string) # how to make this optional
  }))
  default = []
}
