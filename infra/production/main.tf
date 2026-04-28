provider "docker" {
  # Default targets macOS Docker Desktop's socket. Linux operators should
  # set TF_VAR_docker_host=unix:///var/run/docker.sock before apply.
  host = var.docker_host != "" ? var.docker_host : "unix://${pathexpand("~/.docker/run/docker.sock")}"
}

locals {
  project_root = abspath("${path.module}/../..")
}

module "stack" {
  source = "../modules/todo-stack"

  env_name     = "production"
  project_root = local.project_root
  api_port     = var.api_port
  web_port     = var.web_port
  jwt_secret   = var.jwt_secret
  log_level    = var.log_level

  seed_enabled = false
}

output "api_url" {
  value = module.stack.api_url
}

output "web_url" {
  value = module.stack.web_url
}
