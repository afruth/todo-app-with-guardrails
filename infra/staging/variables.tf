variable "api_port" {
  description = "Host port for the staging API."
  type        = number
  default     = 5600
}

variable "web_port" {
  description = "Host port for the staging web UI."
  type        = number
  default     = 5601
}

variable "log_level" {
  description = "Winston log level for the staging API."
  type        = string
  default     = "debug"
}

variable "jwt_secret" {
  description = "JWT signing secret for staging. Provide via terraform.tfvars (gitignored)."
  type        = string
  sensitive   = true
}

variable "docker_host" {
  description = "Docker daemon socket. Default targets macOS Docker Desktop. Linux: \"unix:///var/run/docker.sock\". Override via TF_VAR_docker_host."
  type        = string
  default     = ""
}
