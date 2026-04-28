Param(
  [string]$ComposeFile = "docker-compose.toolbox.yml"
)

# Docker Toolbox setups commonly require explicit compose file and no BuildKit assumptions.
docker-compose -f $ComposeFile up --build -d
