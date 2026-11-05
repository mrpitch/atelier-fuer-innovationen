# 06. Runtime View

Three runtime scenarios: how a page is served, how search works without a server, and what runs when a change is published.

## Concepts

- [runtime-main-flow](./runtime-main-flow.md) — What happens when a visitor opens a page: CloudFront serves static files from S3 and the browser does the rest, with no server code involved.
- [runtime-search](./runtime-search.md) — How search works without a server: the browser downloads a prebuilt index once and queries it locally.
- [runtime-publish-change](./runtime-publish-change.md) — What runs when a contributor pushes to main: validation and deploy start in parallel, and a failed validation does not stop the deploy.
