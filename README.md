# Rent \& Flatmate Finder

A full-stack platform where owners list rooms and tenants create "looking for room" profiles.
An LLM-powered compatibility engine scores and ranks matches, real-time chat unlocks once
interest is accepted, and email notifications fire on key events.

**Live app:** `https://rent-flatmate-frontend-63p6.onrender.com`

\---

## Tech Stack

* **Backend:** FastAPI, SQLAlchemy, JWT auth (python-jose + passlib/bcrypt)
* **Frontend:** React + Vite
* **Database:** PostgreSQL (production, on Render) / SQLite (local dev)
* **AI:** Groq (`llama-3.1-8b-instant`) for compatibility scoring, with a rule-based fallback
* **Real-time:** WebSocket chat, messages persisted to DB
* **Email:** Resend (free tier)
* **Hosting:** Render (separate frontend + backend + Postgres services)

\---

## Setup Guide

### Prerequisites

* Python 3.10+
* Node.js 18+
* (Optional) Postgres if you don't want to use SQLite locally

### 1\. Clone the repo

```bash
git clone https://github.com/Nishka2505/rent-flatmate-finder.git
cd rent-flatmate-finder
```

### 2\. Backend setup

```bash
cd backend
python -m venv venv
venv\\Scripts\\Activate.ps1        # Windows PowerShell
# source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
```

Copy `.env.example` to `.env` in `backend/` and fill in real values:

```bash
copy .env.example .env
```

Run the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

API will be live at `http://127.0.0.1:8000`, interactive docs at `http://127.0.0.1:8000/docs`.

### 3\. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` in `frontend/` with:

```
VITE\_API\_URL=http://127.0.0.1:8000
```

Run the frontend:

```bash
npm run dev
```

### 4\. (Optional) Seed sample data

A seed script (`backend/seed\_rooms.py`) populates dummy owner accounts and room
listings across major Indian cities so the app isn't empty on first run:

```bash
cd backend
python seed\_rooms.py
```

\---

## API Documentation

Base URL (local): `http://127.0.0.1:8000`

### Auth (`/auth`)

|Method|Endpoint|Auth|Description|
|-|-|-|-|
|POST|`/auth/register`|none|Register as `tenant` or `owner`. Body: `{email, password, role}`|
|POST|`/auth/login`|none|OAuth2 form login (`username`=email, `password`). Returns JWT `access\_token`|
|GET|`/auth/me`|Bearer token|Returns the current logged-in user|

### Rooms (`/rooms`)

|Method|Endpoint|Auth|Description|
|-|-|-|-|
|POST|`/rooms/`|owner|Create a room listing|
|GET|`/rooms/`|optional|List available (unfilled) rooms, filterable by `location`, `min\_rent`, `max\_rent`. If a tenant is logged in with a profile, results include `compatibility\_score` + `compatibility\_explanation` and are sorted by score descending|
|GET|`/rooms/{listing\_id}`|none|Get a single listing|
|GET|`/rooms/owner/my-listings`|owner|List the current owner's own listings|
|PATCH|`/rooms/{listing\_id}/fill`|owner (must own listing)|Mark a listing as filled (hides it from search)|
|GET|`/rooms/interest/received`|owner|View interest requests received on the owner's listings|
|PATCH|`/rooms/interest/{interest\_id}/respond`|owner (must own listing)|Accept or decline an interest request. Body: `{status: "accepted" \| "declined"}`. Triggers a status-update email to the tenant|

### Tenants (`/tenants`)

|Method|Endpoint|Auth|Description|
|-|-|-|-|
|POST|`/tenants/profile`|tenant|Create or update tenant profile (`preferred\_location`, `budget\_min`, `budget\_max`, `move\_in\_date`)|
|GET|`/tenants/profile`|tenant|Get the current tenant's profile|
|POST|`/tenants/interest`|tenant|Express interest in a listing. Body: `{listing\_id}`. If the cached compatibility score is ≥ 80, sends a notification email to the owner|
|GET|`/tenants/interest/my-requests`|tenant|List the tenant's own interest requests|

### Chat (WebSocket)

|Endpoint|Auth|Description|
|-|-|-|
|`ws://<host>/ws/chat/{interest\_request\_id}?token=<JWT>`|tenant or owner party to that interest request|Real-time chat, only usable once the interest request status is `accepted`. On connect, sends full message history, then streams new messages to both parties. Every message is persisted to the `messages` table|

\---

## Database Schema

* **users** — `id`, `email` (unique), `hashed\_password`, `role` (`tenant`/`owner`/`admin`), `created\_at`
* **room\_listings** — `id`, `owner\_id` → users, `location`, `rent`, `available\_from`, `room\_type`, `furnishing\_status`, `photo\_urls`, `is\_filled`, `created\_at`
* **tenant\_profiles** — `id`, `user\_id` → users (1:1), `preferred\_location`, `budget\_min`, `budget\_max`, `move\_in\_date`
* **compatibility\_scores** — `id`, `tenant\_id` → tenant\_profiles, `listing\_id` → room\_listings, `score` (0–100), `explanation`, `computed\_at`. Computed once per tenant–listing pair and cached, not recomputed on every request
* **interest\_requests** — `id`, `tenant\_id` → tenant\_profiles, `listing\_id` → room\_listings, `status` (`pending`/`accepted`/`declined`), `created\_at`
* **messages** — `id`, `interest\_request\_id` → interest\_requests, `sender\_id` → users, `content`, `sent\_at`

Relationships: a `User` (owner) has many `RoomListing`s; a `User` (tenant) has one `TenantProfile`;
a `TenantProfile` and `RoomListing` pair produce one cached `CompatibilityScore` and can have one
`InterestRequest`, which owns many `Message`s once accepted.

\---

## LLM Compatibility Scoring — Prompt \& Example I/O

**Model:** `llama-3.1-8b-instant` via Groq API, `temperature=0.3`, `max\_tokens=200`

**Prompt template** (`backend/app/compatibility.py`):

```
Given this room listing: {listing\_json}
and this tenant profile: {tenant\_json},
compute a compatibility score from 0 to 100 based on budget and location match.
Return ONLY valid JSON in this exact format with no other text:
{"score": number, "explanation": string}
```

**Example input:**

```json
// listing
{"location": "Koramangala, Bangalore", "rent": 15000.0, "available\_from": "2026-07-15",
 "room\_type": "1RK", "furnishing\_status": "semi-furnished"}

// tenant profile
{"preferred\_location": "Koramangala", "budget\_min": 10000.0, "budget\_max": 20000.0,
 "move\_in\_date": "2026-08-01"}
```

**Example output:**

```json
{"score": 92, "explanation": "Strong match: location aligns exactly with tenant preference, and rent (₹15,000) sits comfortably within the ₹10,000–20,000 budget range."}
```

**Fallback:** If the Groq API key is missing, the call fails, or the response isn't valid JSON,
`llm\_compatibility\_score()` catches the exception and falls back to `rule\_based\_score()`, which
awards up to 50 points for a location substring match and up to 50 points for the rent falling
within `\[budget\_min, budget\_max]` (partial credit if slightly over/under budget). This guarantees
every tenant–listing pair always gets a usable score even if the LLM is down.

\---

## Notification Flow

* **Owner notified** when a tenant expresses interest **and** the cached compatibility score is ≥ 80 (`send\_interest\_notification\_email`)
* **Tenant notified** when the owner accepts or declines their interest request (`send\_status\_update\_email`)
* Both use Resend's free tier; if `EMAIL\_API\_KEY` is unset, sends are skipped with a console log instead of failing the request

\---

## Deployment

* **Frontend:** Render Static Site, built with `npm run build`, env var `VITE\_API\_URL` pointing to the backend's Render URL (must redeploy after changing, since Vite bakes env vars in at build time)
* **Backend:** Render Web Service (Python 3), `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Database:** Render PostgreSQL (managed), connected via `DATABASE\_URL`

