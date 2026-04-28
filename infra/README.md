# Local infra — staging & production via Terraform + Docker

This directory contains the Terraform IaC for running the todo app in two
isolated local environments — **staging** and **production** — at the same
time on your Mac.

## Layout

```
infra/
├── modules/todo-stack/   # reusable module (one instance per env)
├── staging/              # `cd` here and `terraform apply` to bring up staging
├── production/           # same, for production
└── scripts/seed-staging.sh
```

Each env owns its own:
- Docker images (`todo-api-<env>`, `todo-web-<env>`)
- Containers (`todo-api-<env>`, `todo-web-<env>`)
- Network (`todo-net-<env>`)
- Volumes (`todo-data-<env>`, `todo-uploads-<env>`)
- Host ports (see table below)

| Env        | UI URL                  | API URL                 |
|------------|-------------------------|-------------------------|
| staging    | http://localhost:5601   | http://localhost:5600   |
| production | http://localhost:6601   | http://localhost:6600   |

All ports bind to `127.0.0.1` only.

## Prerequisites

- Docker Desktop running (`docker info` succeeds)
- Terraform ≥ 1.6 (`terraform version`)

## Bring up staging

```bash
cd infra/staging
cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars                # paste a fresh JWT secret
terraform init
terraform apply -auto-approve
```

After apply, staging is auto-seeded with a test user:

| email                    | password           |
|--------------------------|--------------------|
| `staging@example.local`  | `staging-password` |

## Bring up production

```bash
cd infra/production
cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars                # use a DIFFERENT secret from staging
terraform init
terraform apply -auto-approve
```

Production is **not** seeded — sign up via the UI yourself.

## Verify

```bash
docker ps --filter name=todo- --format '{{.Names}}\t{{.Status}}'
curl -fsS http://localhost:5600/api/health    # staging  -> {"status":"ok"}
curl -fsS http://localhost:6600/api/health    # prod     -> {"status":"ok"}
open http://localhost:5601                    # staging UI
open http://localhost:6601                    # production UI
```

Persistence sanity check:
```bash
docker restart todo-api-staging               # data must survive
```

## Generate a JWT secret

```bash
openssl rand -base64 48
```

## Teardown

```bash
cd infra/staging    && terraform destroy -auto-approve
cd ../production    && terraform destroy -auto-approve
```

Reset staging data without destroying infra:
```bash
cd infra/staging
terraform destroy -auto-approve \
  -target=module.stack.docker_volume.data \
  -target=module.stack.docker_volume.uploads
terraform apply -auto-approve
```

## Notes

- Each env's `terraform.tfvars` is gitignored. The `.example` is committed.
- `.terraform.lock.hcl` is committed (locks provider versions).
- Terraform state lives next to each root module by default; treat it as
  local-only — do not commit `*.tfstate*`.
- Image rebuilds are triggered by sha1 hashes of `src/**`, `web/{src,public}/**`,
  manifests, the Dockerfile, and the nginx template. Touch any of those
  and the next `terraform apply` will rebuild.
