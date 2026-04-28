output "api_url" {
  description = "Local URL of the API container."
  value       = "http://localhost:${var.api_port}"
}

output "web_url" {
  description = "Local URL of the web (nginx) container."
  value       = "http://localhost:${var.web_port}"
}

output "api_container_name" {
  value = docker_container.api.name
}

output "web_container_name" {
  value = docker_container.web.name
}

output "data_volume" {
  value = docker_volume.data.name
}

output "uploads_volume" {
  value = docker_volume.uploads.name
}
