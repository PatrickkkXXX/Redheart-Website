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

`customizer/` is a self-contained, real-time 3D configurator for aluminium
windows, glass, mirrors and (on the roadmap) cabinets. It is plain ES-module
JavaScript with **Three.js vendored locally** — no build step and no runtime CDN
dependency, so it deploys on Netlify like the rest of the site and works offline.

Open it at `/customizer/`. It is linked from the main navigation ("3D Designer")
and a promo band on the home page.

```
customizer/
  index.html              Layout: left config · centre 3D stage · right summary
  css/customizer.css
  js/
    config.js             Catalogs: products, colours, finishes, glass, mirrors,
                          dimension rules, accessories, PRICING rules
    state.js              Config store — single source of truth, validation,
                          URL (?c=) + localStorage save/restore
    materials.js          PBR frame / glass / mirror materials (+ low-qual path)
    pricing.js            Itemised estimate calculator
    geometry/
      index.js            Builder registry (new product builders slot in here)
      sliding.js          Parametric sliding / fixed window + sliding door
    scene.js              Renderer, lighting, OrbitControls, views, exploded
                          view, dimension guides, mirror reflections, PNG export
    ui.js                 Builds the control panels + summary from the catalogs
    main.js               Wiring
  vendor/three/           Three.js r160 (module + OrbitControls, RoomEnvironment,
                          CSS2DRenderer, Reflector) — vendored, no CDN
```

### What works today
Fully interactive 3D sliding window (plus fixed window and sliding door, which
share the builder): 360° orbit / zoom / pan, front·side·top·3D views, reset,
exploded view, full screen, light/dark/studio backgrounds. Independent frame
colour + finish, all glass types (real transmission) and mirrors (real planar
reflection), live dimensions with on-model guides (mm/cm/in), panel count,
accessories, an itemised **estimate**, save / shareable link / image export /
spec sheet, A/B comparison, and a Messenger quotation with the full spec.

### Change things without touching 3D code
| Want to change | Edit |
| --- | --- |
| Colours, glass, mirrors, accessories | `customizer/js/config.js` (catalog arrays) |
| **Prices** (placeholder estimates) | `customizer/js/config.js` → `PRICING` |
| Dimension limits / presets | `customizer/js/config.js` → `DIMENSIONS`, `SIZE_PRESETS` |
| Messenger handle | `customizer/js/main.js` → `MESSENGER` |

Pricing figures are **placeholder estimates** in PHP and are labelled as such in
the UI — replace them with the business's real rates. New window designs and the
cabinet builder register in `geometry/index.js` without rebuilding the app.

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
