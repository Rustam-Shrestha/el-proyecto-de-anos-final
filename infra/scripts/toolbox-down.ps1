Param(
  [string]$ComposeFile = "docker-compose.toolbox.yml"
)

docker-compose -f $ComposeFile down -v
