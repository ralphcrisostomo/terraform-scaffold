resource "aws_appsync_resolver" "pipeline" {
  api_id = var.api_id
  type   = var.type
  field  = var.field
  kind   = "PIPELINE"
  code   = file(var.code_path)

  runtime {
    name            = var.runtime_name
    runtime_version = var.runtime_version
  }

  pipeline_config {
    functions = var.function_ids
  }
}
