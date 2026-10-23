# Redheart Glass & Aluminum Supply

Marketing site for Redheart Glass and Aluminum Supply — aluminium and glass
fabrication in San Jose, Narvacan, Ilocos Sur, Philippines.

**Live:** https://redheart-glass-and-aluminum-supply.netlify.app/

## Structure

```
index.html            Single-page marketing site
css/style.css         Stylesheet
js/main.js            Interaction and animation
img/                  Project photographs and logo
customizer/           3D product configurator (see below)
netlify.toml          Netlify config (publish directory + cache headers)
robots.txt
sitemap.xml
```

## 3D Product Customizer

`customizer/` is a self-contained, real-time 3D configurator (Coohom-style). It is
deliberately simple — the customer changes only three things:

1. **Product** — window, door or cabinet, each with style/panel variants
   (2/3/4/6-panel sliding, casement, awning, butterfly, French, swing, display
   cabinets, etc.).
2. **Aluminium colour** — 10 finishes plus a custom colour picker.
3. **Glass** — clear, tints, frosted, reflective.

No measurements, pricing or clutter. The viewer has smooth orbit with gentle
auto-spin, front/side/top/3D views, light/studio/dark scenes, reset and full
screen. Customers can save, share a link, export a preview image, and request a
quote via Messenger with the design attached.

It is plain ES-module JavaScript with **Three.js vendored locally** — no build
step and no runtime CDN dependency, so it deploys on Netlify like the rest of the
site and works offline. Open it at `/customizer/`; it is linked from the main
navigation ("3D Designer") and a promo band on the home page.

```
customizer/
  index.html              Layout: left config · centre 3D stage · right summary
  css/customizer.css
  js/
    config.js             Catalogs: CATEGORIES, STYLES, FRAME_COLORS, GLASS
    state.js              Config store — single source of truth, URL (?c=) +
                          localStorage save/restore
    materials.js          PBR frame / glass materials (+ low-quality fallback)
    geometry/
      index.js            Builder registry (new builders slot in here)
      opening.js          Parametric windows & doors (sliding/casement/awning/
                          butterfly/French/swing/fixed)
      cabinet.js          Parametric glass cabinets (hinged / sliding doors)
    scene.js              Renderer, lighting, OrbitControls, auto-spin, views,
                          smooth model swap, PNG export
    ui.js                 Builds the control panels + summary from the catalogs
    main.js               Wiring
  vendor/three/           Three.js r160 (module + OrbitControls, RoomEnvironment)
                          — vendored locally, no CDN
```

### Change things without touching 3D code
| Want to change | Edit |
| --- | --- |
| Colours & glass options | `customizer/js/config.js` (`FRAME_COLORS`, `GLASS`) |
| Products / styles / panel counts | `customizer/js/config.js` (`STYLES`) |
| Messenger handle | `customizer/js/main.js` (`MESSENGER`) |

New window/door styles are added as entries in `STYLES`; new geometry builders
register in `customizer/js/geometry/index.js` without rebuilding the app.

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
