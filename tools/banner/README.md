# Profile banner source

This tool runs the original React Bits Galaxy component, overlays the profile title, records deterministic browser frames, and exports the images used by the profile README.

## Setup

Requires Node.js 20+ and Python 3.10+.

```sh
cd tools/banner
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npx playwright install chromium
```

The Node and Python dependencies are pinned. The Geist font is stored locally, so previewing and rendering need no external requests after setup.

## Preview and export

```sh
npm run preview
```

Open the printed local URL to see the animation. Stop with Ctrl+C.

```sh
PYTHON=.venv/bin/python npm run render
```

This records 100 source frames, blends the loop boundary, validates the encoded frames, then replaces `assets/profile-stars.gif` and `assets/profile-stars.png`. The final animation is 80 frames at 20 fps, or 4 seconds. Temporary files stay in ignored `.build/` and `.frames/` directories.

To use an existing Chrome installation instead of Playwright's Chromium:

```sh
BROWSER_CHANNEL=chrome PYTHON=.venv/bin/python npm run render
```

Set `HEADED=1` to show the recording browser. Browser and GPU differences can affect pixel-level output even with the same animation timestamps; the component and capture settings remain reproducible.

## Make changes

Edit `banner.config.json`:

| Setting | Controls |
| --- | --- |
| `title` | Foreground text |
| `typography` | Size, weight, spacing, and color at capture resolution |
| `background` | Page background behind the transparent starfield |
| `galaxy` | Props passed directly to the original Galaxy component |
| `capture` | Recording size, frame rate, start time, and number of frames |
| `output` | Export size and number of frames used for the loop crossfade |

The title renders at 99.84 pixels in a 1760-pixel-wide capture, equivalent to 49.92 pixels when displayed at 880 pixels wide. This is 30% larger than the original demo heading.

The current encoder converts the capture to neutral grayscale and uses a fixed palette, limiting encoding changes to one grayscale level per pixel. Color props therefore change brightness rather than preserving hue in the exported assets.

## Files and attribution

- `vendor/Galaxy.jsx` and `vendor/Galaxy.css`: unchanged [React Bits Galaxy source](https://github.com/DavidHDev/react-bits/tree/3a1c7f2f9f94ed833934ab5c2635760b9e644583/src/content/Backgrounds/Galaxy), revision `3a1c7f2f9f94ed833934ab5c2635760b9e644583`, included as part of this banner renderer. See `vendor/LICENSE.md`.
- `src/` and `public/index.html`: the profile title and preview page.
- `public/Geist.woff2`: the original demo's Geist variable font; see `public/Geist-LICENSE.txt`.
- `scripts/build.mjs` and `scripts/serve.mjs`: local build and preview infrastructure.
- `scripts/render.mjs`: browser capture with controlled animation timestamps.
- `scripts/encode.py`: GIF/PNG export and frame validation.

SHA-256 of the original source and font:

```text
1f40a69c2d1a93d66481008d44899d7f6665904ae80ffb2de43f99add582c077  vendor/Galaxy.jsx
e24cec106619c03f0b3519e31b9bc55e0d5e926b6a95b8d798cd8cef215b1505  public/Geist.woff2
```
