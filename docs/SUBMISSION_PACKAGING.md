# Submission Packages

Run `scripts/package-submission.ps1` to generate two delivery archives in `release/`:

- `lingshan-ai-digital-human-source.zip`: complete project runtime source, configuration, database snapshots, MCP integration, miniprogram, and static web output.
- `lingshan-ai-digital-human-scripts.zip`: dependency installation, service startup, shutdown, status, health-check, and packaging scripts.

Both archives use the same top-level directory, `lingshan-ai-digital-human`. Extract both archives into the same destination so the `scripts/` directory merges with the source tree. Then run:

```bash
bash scripts/install-dependencies.sh
bash scripts/start-all.sh
```

The package process excludes documentation, tests, dependency directories, build caches, logs, local tools, prototypes, and Git metadata.
