variable "env_name" {
  description = "Environment label, e.g. \"staging\" or \"production\". Used in container/volume/network names."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.env_name))
    error_message = "env_name must be lowercase alphanumeric with dashes."
  }
}

variable "project_root" {
  description = "Absolute path to the repo root (the directory containing the Dockerfile)."
  type        = string
}

variable "api_port" {
  description = "Host port for the API container (maps to internal 5600)."
  type        = number
}

variable "web_port" {
  description = "Host port for the web/nginx container (maps to internal 80)."
  type        = number
}

variable "jwt_secret" {
  description = "JWT signing secret for the API. Generate with: openssl rand -base64 48."
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "jwt_secret must be at least 32 characters."
  }
}

variable "log_level" {
  description = "Winston log level (info, debug, warn, error)."
  type        = string
  default     = "info"
}

variable "image_tag" {
  description = "Tag suffix for built images."
  type        = string
  default     = "local"
}

variable "seed_enabled" {
  description = "If true, run the staging seed script after the API container becomes healthy."
  type        = bool
  default     = false
}

variable "seed_script" {
  description = "Absolute path to the seed shell script (only used when seed_enabled = true)."
  type        = string
  default     = ""
}
