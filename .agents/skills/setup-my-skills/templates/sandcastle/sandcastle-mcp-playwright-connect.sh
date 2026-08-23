#!/bin/sh
# Connects playwright-mcp (running inside this sandbox container) to the real
# Chrome that run-sandcastle.ts launched on the host, over CDP.
#
# host.docker.internal can't be handed to Chrome directly: Chrome's
# remote-debugging server rejects any request whose Host header isn't
# "localhost" or a literal IP address (DNS-rebinding protection, shipped
# since Chrome 66), and host.docker.internal is a hostname. So this resolves
# it to its IP first and uses that IP for the whole endpoint.
set -e

if [ -z "$SANDCASTLE_CDP_PORT" ]; then
	echo "SANDCASTLE_CDP_PORT is not set — run-sandcastle.ts should set this before starting the container." >&2
	exit 1
fi

HOST_IP=$(node -e "require('dns').lookup('host.docker.internal',{family:4},(e,a)=>{if(e){process.exit(1)};process.stdout.write(a)})")

exec npx --no-install @playwright/mcp --cdp-endpoint="http://${HOST_IP}:${SANDCASTLE_CDP_PORT}"
