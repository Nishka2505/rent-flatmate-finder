## Known Limitations

- **Free-tier database expiry:** This project runs on Render's free PostgreSQL tier, which automatically expires after 90 days of use. If the live demo appears to have lost data or is temporarily down, the database has likely expired and needs to be recreated — this is a platform constraint, not an application bug.


## Testing

This project includes a Pytest suite covering authentication and role-based access control (14 tests). Run locally with:

\`\`\`bash
python -m pytest -v
\`\`\`

Tests run against an isolated SQLite database and do not touch production data.



