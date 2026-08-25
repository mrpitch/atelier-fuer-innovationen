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

# --allow-unrestricted-file-access lifts playwright-mcp's default block on
# file:// navigation and its workspace-root file-access restriction, so an
# agent can verify a rendered local page directly instead of base64-encoding
# it into a data: URL. This is not a contained trade-off: navigation happens
# in the real host Chrome this script connects to (see the header comment
# above), so the flag grants read access to whatever that host Chrome
# process can see on the *host* filesystem, not just this disposable
# container. It's scoped here only because this script is exclusively the
# sandbox's own playwright-mcp connection — do not carry this flag into any
# host-side MCP configuration, where the same host Chrome would be reachable
# from an interactive session with no sandbox boundary around it at all.
exec npx --no-install @playwright/mcp --cdp-endpoint="http://${HOST_IP}:${SANDCASTLE_CDP_PORT}" --allow-unrestricted-file-access
