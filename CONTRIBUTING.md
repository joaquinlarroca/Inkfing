# Contributing to InkFing

Thanks for wanting to help improve InkFing!

## Getting started

1. Fork the repository and clone your fork locally.
2. Load the extension in your browser:
   - Chrome: [Load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) -> select the repo folder.
   - Firefox: follow the [temporary add-on](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) guide.
3. Pick an issue to work on, or open a new one for the problem you found.

## Where things live

- `manifest.json` — extension config and which scripts/styles load on each site.
- `css/root.css` — shared color tokens. **Define every color you reuse here** instead of repeating hex codes.
- `css/<site>.css` — site-specific dark-mode overrides. File name matches the host, e.g. `eva.fing.edu.uy.css`.
- `js/theme-images.js` — shared engine that recolorizes images into the theme palette.
- `js/<site>.js` — site-specific scripting (Moodle course tree, etc.).
- `options/` — the extension options page.

## Style guide

- **CSS**: favor the `--inkFing-*` variables from `root.css`. Content-script overrides must beat the site's stylesheets, so `!important` is expected there.
- **JS**: keep site scripts thin — put anything reusable in a shared file (e.g. `theme-images.js`) and load it from `manifest.json` before the site script.
- Don't add comments that just repeat the code; document *why*, not *what*.

## Checking your work

The CI workflow (`node scripts/check-css.js`) validates that:

- `manifest.json` is valid JSON.
- every JS file passes `node --check`.
- CSS braces are balanced and every `var(--inkFing-*)` reference exists in `root.css`.

Run it locally before pushing:

```sh
node scripts/check-css.js
for file in js/*.js options/*.js; do node --check "$file"; done
```

## Pull request workflow

1. Branch off `main` with a descriptive name (e.g. `fix/eva-nav-menu`).
2. Make your change and verify with the checks above.
3. Bump the `version` field in `manifest.json` for any user-facing change.
4. Open a PR using the template and link any related issue.

## Found a problem?

Report it in the [Issues](https://github.com/LibreCourseUY/Inkfing/issues) section using the available templates.