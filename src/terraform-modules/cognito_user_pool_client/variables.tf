variable "project" {
  description = "Project name used for naming the User Pool Client"
  type        = string
}

variable "user_pool_id" {
  description = "ID of the Cognito User Pool"
  type        = string
}

variable "callback_urls" {
  description = "List of allowed callback URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  description = "List of allowed logout URLs for OAuth"
  type        = list(string)
  default     = []
}

variable "access_token_validity" {
  description = "Access token validity in minutes"
  type        = number
  default     = 1440 # 5 minutes (min) to 1 day (max) → i.e. 5–1440 minutes
}

variable "id_token_validity" {
  description = "ID token validity in minutes"
  type        = number
  default     = 1440 # 5 minutes (min) to 1 day (max) → i.e. 5–1440 minutes
}

variable "refresh_token_validity" {
  description = "Refresh token validity in minutes"
  type        = number
  default     = 5256000 # 60 minutes (1 hour) (min) to 10 years (max) → 60–5256000 minutes
}
