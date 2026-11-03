# Good Time Machine

Website for the Good Time Machine improv troupe. Plain HTML/CSS/JS — no build step required.

## Editing content

- `index.html` — page content (about, team bios, contact info).
- `shows.json` — the list of shows. Edited through the admin page (below); the site sorts them into Upcoming and Past automatically.
- `styles.css` — colors, fonts, layout.
- `script.js` — mobile nav toggle, footer year, and rendering of the shows list.
- `images/` — photos (poster, gallery, headshots).

## Admin page (manage shows)

`admin.html` lets password-holders add, edit, and delete shows (theater, date, time, ticket link). It is not linked from the site; the address is `https://hannagh.github.io/goodtimemachine/admin.html`.

GitHub Pages can only serve static files, so saving goes through a small Cloudflare Worker (`worker/worker.js`). The Worker checks the password on the server, then commits the updated `shows.json` to this repo. The site updates 1–2 minutes after each save.

### One-time setup

1. **GitHub token.** GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token. Under "Repository access" choose **Only select repositories** → `goodtimemachine`. Under "Repository permissions" set **Contents** to **Read and write**. Generate it and copy it (it is only shown once). When the token expires the admin page stops saving; generate a new one and replace the `GITHUB_TOKEN` secret.
2. **Cloudflare Worker.** Sign up free at dash.cloudflare.com → Workers & Pages → Create → Create Worker. Name it `good-time-machine-admin`, click Deploy, then **Edit code**, replace everything with the contents of `worker/worker.js`, and Deploy.
3. **Secrets.** In the Worker → Settings → Variables and Secrets, add two entries of type **Secret**: `ADMIN_PASSWORD` (pick a long password, 14+ characters, since that is the only thing protecting the page) and `GITHUB_TOKEN` (the token from step 1). Deploy again.
4. **Connect the page.** Copy the Worker's URL (`https://good-time-machine-admin.<your-subdomain>.workers.dev`) and set it as `WORKER_URL` at the top of `admin.js`.

To change the password later, edit the `ADMIN_PASSWORD` secret in Cloudflare.

## Previewing locally

The shows list is loaded from `shows.json`, so opening `index.html` directly from disk won't show it. Run a local server instead:

```
python -m http.server 5173
```

then visit `http://localhost:5173`.

## Publishing with GitHub Pages

This repo is set up for `https://github.com/Hannagh/goodtimemachine`.

1. Push this code to the `main` branch of that repo.
2. On GitHub, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch".
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
5. Your site will be published at `https://hannagh.github.io/goodtimemachine/` within a minute or two.
