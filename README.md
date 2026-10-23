# Redheart Glass & Aluminum Supply

Marketing site for Redheart Glass and Aluminum Supply — aluminium and glass
fabrication in San Jose, Narvacan, Ilocos Sur, Philippines.

**Live:** https://redheart-glass-and-aluminum-supply.netlify.app/

## Structure

```
index.html        Single-page site
css/style.css     Stylesheet
js/main.js        Interaction and animation
img/              Project photographs and logo
netlify.toml      Netlify config (publish directory + cache headers)
robots.txt
sitemap.xml
```

No build step and no dependencies. Open `index.html` in a browser, or serve the
folder locally:

```bash
python3 -m http.server 8080
```

## Deployment

Netlify publishes the repository root (`publish = "."` in `netlify.toml`).
Every push to `main` triggers a deploy. Because the files sit at the root,
`index.html` is found straight away — this is what the earlier
"Page not found" error was about, when the site lived in a subfolder.

## Editing content

| What | Where |
| --- | --- |
| Services | `index.html` → `<section id="services">` |
| Gallery photos | `index.html` → `<section id="work">` and `img/` |
| Standards / why us | `index.html` → `<section id="standards">` |
| Process steps | `index.html` → `<section id="process">` |
| Testimonials | `index.html` → `<section id="clients">` |
| Address, hours, links | `<section id="enquire">` and the footer |
| Colours and type | `css/style.css` → `:root` tokens |
| Messenger handle | `js/main.js` → `MESSENGER` |

The enquiry form has no backend: it builds a pre-written message and opens
Facebook Messenger to the Redheart page in a new tab.

## Accessibility & motion

Semantic landmarks, labelled form fields, visible focus styles, a skip link and
keyboard-operable gallery/lightbox. All motion is disabled automatically for
visitors who set `prefers-reduced-motion: reduce`.
