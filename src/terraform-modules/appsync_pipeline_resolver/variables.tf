variable "api_id" {
  description = "AppSync API ID"
  type        = string
}

variable "type" {
  description = "GraphQL type (e.g. Mutation, Query)"
  type        = string
}

variable "field" {
  description = "Field name in the schema (e.g. createUser)"
  type        = string
}

variable "code_path" {
  description = "Path to the base function code (e.g. base.js)"
  type        = string
}

variable "function_ids" {
  description = "List of AppSync function IDs to be executed in the pipeline"
  type        = list(string)
}

variable "runtime_name" {
  default     = "APPSYNC_JS"
  description = "AppSync function runtime"
}

variable "runtime_version" {
  default     = "1.0.0"
  description = "AppSync function runtime version"
}
