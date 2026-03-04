locals {

  # Variables sent into templatefile when using template_code_path:
  # - ENVIRONMENT_VARIABLES is injected as a raw JS object via jsonencode
  tpl_vars = merge(
    {
      ENVIRONMENT_VARIABLES = jsonencode(var.environment_variables)
    },
    var.template_vars
  )
}


resource "aws_appsync_function" "function" {
  api_id      = var.api_id
  name        = var.function_name
  data_source = var.data_source_name

  # Choose between rendering a template or reading a plain file
  code = var.is_template ? templatefile(var.code_path, local.tpl_vars) : file(var.code_path)

  runtime {
    name            = var.runtime_name
    runtime_version = var.runtime_version
  }

}
