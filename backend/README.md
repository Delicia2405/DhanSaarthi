# Dhansaarthi Backend

Flask API for importing statements, tracking goals, calculating a confidence score, and generating financial insights.

## Run locally

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

The API starts at `http://127.0.0.1:5000`.

## Endpoints

- `GET /api/health`
- `POST /api/upload?user_id=1` with a multipart `file` CSV
- `GET /api/dashboard?user_id=1`
- `GET /api/score?user_id=1`
- `GET /api/goals?user_id=1`
- `POST /api/goals` with `name`, `target_amount`, and `target_date`
- `GET /api/goals/<goal_id>/gap`
- `GET /api/insights?user_id=1`

Set `DATABASE_URL`, `SECRET_KEY`, `AI_API_KEY`, and `AI_API_URL` in `.env`. The checked-in `.env` contains development placeholders only; keep real credentials out of version control.