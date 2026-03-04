# modules/dynamodb_table/main.tf
#
# module "users_table" {
#   source = "./modules/dynamodb_table"
#
#   name     = "${var.PROJECT}_USERS"
#   hash_key = "id"
#
#   attributes = [
#     {
#       name = "id"
#       type = "S"
#     },
#     {
#       name = "email"
#       type = "S"
#     }
#   ]
#
#   global_secondary_indexes = [
#     {
#       name            = "byEmail"
#       hash_key        = "email"
#       projection_type = "ALL"
#     }
#   ]
# }








resource "aws_dynamodb_table" "this" {
  name         = var.name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = var.hash_key
  range_key    = var.range_key != "" ? var.range_key : null # optional

  dynamic "attribute" {
    for_each = var.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  dynamic "global_secondary_index" {
    for_each = var.global_secondary_indexes
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hash_key
      projection_type = global_secondary_index.value.projection_type

      # Only set non_key_attributes when INCLUDE AND list has entries
      non_key_attributes = (
        global_secondary_index.value.projection_type == "INCLUDE" &&
        length(try(global_secondary_index.value.non_key_attributes, [])) > 0
      ) ? global_secondary_index.value.non_key_attributes : null

      range_key = global_secondary_index.value.range_key != "" ? global_secondary_index.value.range_key : null
    }
  }
}
