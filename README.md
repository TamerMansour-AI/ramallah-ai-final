# Ramallah.ai build

Upload the contents of this folder to your hosting provider.

## Configuration

The site expects Supabase credentials to be provided at runtime via `js/env.js`.
Copy `js/env.sample.js` to `js/env.js` and set the following values:

```
window.SUPABASE_URL = 'https://your-project.supabase.co'
window.SUPABASE_ANON_KEY = 'your_anon_key'
```

You can also place the values in a `.env` file (see `.env.example`) and
automatically generate `js/env.js` during deployment.

Both `.env` and `js/env.js` are ignored by git to prevent accidental leakage of
secrets.
