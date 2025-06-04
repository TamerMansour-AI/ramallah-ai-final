# Ramallah.ai build

Static website for the **Ramallah.ai** community platform. The pages are plain
HTML with small JavaScript files that integrate with Supabase. There is no
server‑side component—just upload the files to any static hosting service.

## Project overview

The site highlights Palestinian creators using AI tools. Key sections include:

- **`index.html`** – landing page with a submission form.
- **`gallery.html`** – dynamic gallery of approved works.
- **`creator-profiles.html`** – list of creators.
- **`blog.html`** and **`about.html`** – informational pages.
- **`contact.html`** – contact form backed by Supabase.
- **`admin/admin.html`** – lightweight admin interface to approve submissions.

## Basic setup

1. Clone this repository.
2. Copy `js/env.sample.js` to `js/env.js` and add your Supabase project
   credentials (see below).
3. Optionally create a `.env` file from `.env.example` if you prefer to inject
   credentials during deployment.
4. Serve the files locally with any static HTTP server for testing, e.g.
   `python3 -m http.server`.

## Configuring Supabase

The site expects two values:

```javascript
window.SUPABASE_URL = 'https://your-project.supabase.co'
window.SUPABASE_ANON_KEY = 'your_anon_key'
```

These keys are referenced at runtime by the JavaScript files. Keep them out of
source control—`.env` and `js/env.js` are already in `.gitignore`.

## Dependencies

All JavaScript dependencies are loaded via CDNs; no build tools are required.
You only need a basic HTTP server to preview the site locally.

## Deploying the static site

Upload everything in this folder to your hosting provider (Netlify, Vercel,
GitHub Pages, etc.). Ensure that `js/env.js` is generated with your Supabase
credentials during the deployment process so forms and the admin interface can
connect to your database.


## License

This project is licensed under the [MIT License](LICENSE).
