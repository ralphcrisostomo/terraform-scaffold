variable "api_id" {
  description = "AppSync API ID"
  type        = string
}

variable "function_name" {
  description = "Name of the AppSync function"
  type        = string
}

variable "data_source_name" {
  description = "AppSync Data Source name"
  type        = string
}

variable "code_path" {
  description = "Path to a plain JS resolver file (used if template_code_path is not set)"
  type        = string
  default     = null
}

variable "is_template" {
  description = "Code is template file"
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Map of values to expose to the resolver as ENVIRONMENT_VARIABLES (only used when template_code_path is provided)."
  type        = map(string)
  default     = {}
}

variable "template_vars" {
  description = "Additional variables to pass to templatefile (merged with ENVIRONMENT_VARIABLES)"
  type        = map(string)
  default     = {}
}

variable "runtime_name" {
  description = "AppSync function runtime"
  type        = string
  default     = "APPSYNC_JS"
}

variable "runtime_version" {
  description = "AppSync function runtime version"
  type        = string
  default     = "1.0.0"
}
