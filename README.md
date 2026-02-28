# Garden Plan 2

A whimsical cottagecore garden planner for tracking what is planted in each 1x1 square of your raised beds.

## Run locally

```bash
python server.py
```

Then open <http://localhost:4173>.

## Features

- Interactive map with five raised beds matching your described layout
- Click any square to set vegetable type and planting date
- Update squares during the season or clear harvested squares
- Vegetable icon rendering in each square (no text in-grid)
- Unknown vegetables use a generic plant icon
- Data persists in a local SQLite database (`garden_plan.db`)

## Data storage

The app now saves all plot updates into a local SQLite database through built-in API endpoints:

- `GET /api/plan` loads all saved plots
- `POST /api/plot` upserts one plot
- `DELETE /api/plot/<plotId>` clears one plot
