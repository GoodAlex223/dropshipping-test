# Development container for Dropshipping project
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# Install additional OS packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        postgresql-client \
        redis-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    prisma \
    tsx \
    @playwright/test

# Set working directory
WORKDIR /workspaces/dropshipping

# Set default shell to bash
SHELL ["/bin/bash", "-c"]
