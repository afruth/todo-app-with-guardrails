locals {
  api_image_name = "todo-api-${var.env_name}:${var.image_tag}"
  web_image_name = "todo-web-${var.env_name}:${var.image_tag}"

  api_source_files = fileset(var.project_root, "src/**")
  web_source_files = fileset(var.project_root, "web/{src,public}/**")

  api_build_hash = sha1(join("", [
    for f in local.api_source_files : filesha1("${var.project_root}/${f}")
  ]))

  web_build_hash = sha1(join("", concat(
    [for f in local.web_source_files : filesha1("${var.project_root}/${f}")],
    [
      filesha1("${var.project_root}/web/package.json"),
      filesha1("${var.project_root}/web/package-lock.json"),
      filesha1("${var.project_root}/web/index.html"),
      filesha1("${var.project_root}/web/vite.config.ts"),
      filesha1("${var.project_root}/web/tsconfig.json"),
      filesha1("${var.project_root}/docker/nginx/default.conf.template"),
      filesha1("${var.project_root}/Dockerfile"),
    ],
  )))

  api_full_hash = sha1(join("", [
    local.api_build_hash,
    filesha1("${var.project_root}/package.json"),
    filesha1("${var.project_root}/package-lock.json"),
    filesha1("${var.project_root}/tsconfig.json"),
    filesha1("${var.project_root}/Dockerfile"),
  ]))
}

resource "docker_image" "api" {
  name = local.api_image_name

  build {
    context    = var.project_root
    dockerfile = "Dockerfile"
    target     = "api"
    tag        = [local.api_image_name]
  }

  triggers = {
    sources = local.api_full_hash
  }

  keep_locally = true
}

resource "docker_image" "web" {
  name = local.web_image_name

  build {
    context    = var.project_root
    dockerfile = "Dockerfile"
    target     = "web"
    tag        = [local.web_image_name]
  }

  triggers = {
    sources = local.web_build_hash
  }

  keep_locally = true
}

resource "docker_network" "stack" {
  name   = "todo-net-${var.env_name}"
  driver = "bridge"
}

resource "docker_volume" "data" {
  name = "todo-data-${var.env_name}"
}

resource "docker_volume" "uploads" {
  name = "todo-uploads-${var.env_name}"
}

resource "docker_container" "api" {
  name    = "todo-api-${var.env_name}"
  image   = docker_image.api.image_id
  restart = "unless-stopped"

  env = [
    "NODE_ENV=production",
    "PORT=5600",
    "DB_PATH=/app/data/data.sqlite",
    "LOG_LEVEL=${var.log_level}",
    "JWT_SECRET=${var.jwt_secret}",
  ]

  ports {
    internal = 5600
    external = var.api_port
    ip       = "127.0.0.1"
  }

  volumes {
    volume_name    = docker_volume.data.name
    container_path = "/app/data"
  }

  volumes {
    volume_name    = docker_volume.uploads.name
    container_path = "/app/uploads"
  }

  networks_advanced {
    name    = docker_network.stack.name
    aliases = ["api"]
  }

  healthcheck {
    test = [
      "CMD-SHELL",
      "node -e \"require('http').get('http://localhost:5600/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))\"",
    ]
    interval     = "10s"
    timeout      = "3s"
    retries      = 5
    start_period = "10s"
  }
}

resource "docker_container" "web" {
  name    = "todo-web-${var.env_name}"
  image   = docker_image.web.image_id
  restart = "unless-stopped"

  env = [
    "API_HOST=api",
    "API_PORT=5600",
  ]

  ports {
    internal = 80
    external = var.web_port
    ip       = "127.0.0.1"
  }

  networks_advanced {
    name = docker_network.stack.name
  }

  depends_on = [docker_container.api]
}

resource "null_resource" "seed" {
  count = var.seed_enabled ? 1 : 0

  triggers = {
    container_id = docker_container.api.id
    script_hash  = var.seed_script == "" ? "" : filesha1(var.seed_script)
  }

  provisioner "local-exec" {
    command     = "${var.seed_script} ${var.api_port}"
    interpreter = ["/bin/bash", "-c"]
  }

  depends_on = [docker_container.api]
}
