#!/bin/bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export APP_UID=$(id -u)
export APP_GID=$(id -g)
docker compose up --build --force-recreate 