# System Design Write-Up — Rent & Flatmate Finder

## Compatibility Scoring Design

The core matching problem is: given a tenant's stated preferences (preferred location, budget
range, move-in date) and a room listing's attributes (location, rent, availability, room type,
furnishing), produce a 0–100 score with a human-readable explanation that helps a tenant decide
which rooms are worth pursuing.

Rather than compute this score on every page load, the system computes it **once per
tenant–listing pair** and caches it in a dedicated `compatibility_scores` table, keyed by
`(tenant_id, listing_id)`. When a tenant browses `/rooms`, the backend checks for an existing
score first; only if none exists does it call the scoring function and persist the result. This
keeps repeated browsing fast and cheap and satisfies the requirement that scores be stored, not
recomputed on every request. The tradeoff is that a score can go stale if a tenant edits their
profile afterward; for this assignment's scope that's an acceptable simplification, but a
production version would invalidate/recompute scores on profile changes.

Scores double as the sort key for the listings feed — results are ordered by
`compatibility_score` descending, so the most relevant rooms surface first without the tenant
needing to manually filter.

## LLM Integration and Fallback

The scoring function first attempts to call Groq's `llama-3.1-8b-instant` model with a tightly
constrained prompt: it serializes the listing and tenant profile as JSON, asks for a 0–100 score
based on budget and location match, and instructs the model to return *only* JSON in an exact
schema, with no surrounding text. This minimizes parsing ambiguity, though the code still
defensively strips markdown code fences (```json blocks) in case the model wraps its output
despite instructions — a common real-world LLM quirk.

The response is parsed, the score is clamped to `[0, 100]` in case the model returns something out
of range, and the result is returned. Any failure in this path — missing API key, network error,
malformed JSON, missing keys — is caught by a single broad `except Exception` block, logged, and
silently falls through to `rule_based_score()`. This fallback awards up to 50 points for a
case-insensitive location substring match, and up to 50 for rent falling within budget (partial
credit if slightly over/under). This means the compatibility feature never hard-fails: a tenant
always sees a score and explanation, whether or not the LLM is reachable. The explanation text
differs by path — LLM gives a natural-language reason, the fallback a templated one — an
intentional, honest signal of which path served a given score.

## Chat Implementation

Chat is scoped to an `interest_request_id`, not a generic user-to-user channel — this reflects the
actual model of the product, where conversation only makes sense in the context of a specific
room and a specific accepted interest. The WebSocket endpoint
(`/ws/chat/{interest_request_id}`) authenticates via a JWT passed as a query parameter (since
browser WebSocket clients can't set custom headers), then re-validates on every connection that:
(1) the interest request exists, (2) its status is `accepted` (declined or pending requests
cannot open a chat), and (3) the connecting user is either the tenant or the owner party to that
specific request — preventing any third party from listening in.

An in-memory `ConnectionManager` keeps a dict of `interest_request_id → [WebSocket]`, supporting
multiple simultaneous connections (e.g., both parties online at once) and broadcasting each new
message to all active sockets for that thread. On connect, the full message history is replayed
from the `messages` table before live messages start streaming, so a user rejoining an existing
conversation sees prior context. Every incoming message is written to the database *before* being
broadcast, guaranteeing persistence even if a broadcast fails or a client disconnects mid-send.
The tradeoff of the in-memory connection map is that it's single-process — this is fine for a
single Render web service instance, but would need a pub/sub layer (e.g., Redis) to scale
horizontally across multiple backend instances.

## Notification Flow

Two email triggers cover the spec's required events, both via Resend's free tier. First, when a
tenant expresses interest (`POST /tenants/interest`), the backend checks the cached compatibility
score for that pair; if it's ≥ 80, it emails the owner immediately with the tenant's preferences
and score, so owners are nudged toward their best matches without needing to check the dashboard
constantly. Second, when an owner accepts or declines a request
(`PATCH /rooms/interest/{id}/respond`), the tenant is emailed the outcome, with an added note that
chat is now available if accepted. Both email functions degrade gracefully — if `EMAIL_API_KEY` is
unset or the Resend call throws, the exception is caught and logged rather than failing the parent
request, so a transient email outage never blocks core actions like accepting an interest request.
