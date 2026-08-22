# Good Time Machine

Website for the Good Time Machine improv troupe. Plain HTML/CSS/JS — no build step required.

## Editing content

- `index.html` — all page content (about, shows, team bios, contact info). Look for `TODO` comments and placeholder text.
- `styles.css` — colors, fonts, layout.
- `script.js` — mobile nav toggle + footer year.
- `images/` — add your photos here:
  - `images/poster.jpg` — the troupe poster, shown in the Gallery section.
  - Add more images and `<figure>` blocks in the Gallery section of `index.html` as you get them.

Team bios in the Team section are placeholders — replace the text inside each `.team-bio` paragraph. You can also swap the initials circles for real photos by replacing `.team-photo` divs with `<img>` tags.

## Previewing locally

Just open `index.html` in a browser, or run a local server:

```
npx serve .
```

## Publishing with GitHub Pages

This repo is set up for `https://github.com/Hannagh/goodtimemachine`.

1. Push this code to the `main` branch of that repo.
2. On GitHub, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch".
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
5. Your site will be published at `https://hannagh.github.io/goodtimemachine/` within a minute or two.
