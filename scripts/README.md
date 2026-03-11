# Scripts

Maintenance and migration utilities live here.

Run them from the project root, for example:

```bash
node scripts/fetch_cemeteries.js
node scripts/rename_cemeteries.js
node scripts/register_admin_email.js
python scripts/generate_og.py
```

Most scripts read or write files in `data/`, `assets/images/`, `map.html`,
`public/data/profiles`, and `supabase/schema.sql`.
