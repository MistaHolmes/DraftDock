# DraftDock Monitoring

A lightweight, self-hosted health monitoring system scaffolded for the DraftDock website. It follows the same architecture as the project's root `monitoring/` package: scheduled health probes, a small express dashboard, per-cycle run logs, and batched alerting via SMTP.

See the root `monitoring` package for the full documentation and operational notes. This copy is intended as a starting scaffold — update environment variables in `.env` and customize probes in `src/checkers/` for DraftDock-specific endpoints.
