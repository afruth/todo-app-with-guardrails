variable "api_port" {
  description = "Host port for the production API."
  type        = number
  default     = 6600
}

variable "web_port" {
  description = "Host port for the production web UI."
  type        = number
  default     = 6601
}

variable "log_level" {
  description = "Winston log level for the production API."
  type        = string
  default     = "info"
}

variable "jwt_secret" {
  description = "JWT signing secret for production. Provide via terraform.tfvars (gitignored)."
  type        = string
  sensitive   = true
}

variable "docker_host" {
  description = "Docker daemon socket. Default targets macOS Docker Desktop. Linux: \"unix:///var/run/docker.sock\". Override via TF_VAR_docker_host."
  type        = string
  default     = ""
}
