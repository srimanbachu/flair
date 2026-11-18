# Flair Studio

Flair turns code into customizable graphics and provides a visual canvas for developer diagrams, tutorials, and presentations. The studio is a React + TypeScript frontend. It makes no backend or account requests.

## Run

```sh
npm ci
npm run dev
```

The card editor is at `/cards` (and redirects from `/`). Canvas is at `/canvas`, saved projects at `/projects`, and Dev Tools at `/dev-tools`. The original introduction remains at `/intro`.

```sh
npm run build      # TypeScript + production bundle
npm run lint       # ESLint
npm test           # Playwright browser regression tests
npm run format     # Format studio and tests
```

Browser tests use an installed Google Chrome (`channel: chrome`). Change the Playwright configuration if using Playwright-managed Chromium instead.

## Appearance

Flair ships a pitch-black dark theme and a pure-white light theme. The first visit follows the system setting; the sun/moon button beside the logo switches themes and remembers the choice in `localStorage` (`flair.theme`). Theme tokens live on `:root` in `src/index.css`, and surfaces are separated by tone rather than borders. The canvas board follows the theme too: built-in drawing colours are stored once and drawn with light-mode counterparts on a white board (`src/studio/canvasPalette.ts`), and PNG/SVG exports use the theme you are viewing.

## Code cards

- Multiple independently editable code blocks, language selection, custom labels, file names, and code copying.
- Eight syntax palettes; system and installed font choices; size, line height, letter spacing, and line numbers.
- Per-block line ranges (`2-5, 8`), highlighted words separated by commas, blurred lines, glowing lines, and comment indicators.
- macOS, Windows, Minimal, Terminal, and Glass window treatments with optional controls and file names.
- Solid, linear, radial, mesh, grid, dots, blobs, and image backgrounds, plus Midnight, Aurora, Sunset, Ocean, Carbon, Paper, Glass, and Terminal presets. Uploaded raster backgrounds are embedded in the project. Background blur, opacity, and grain controls are independent.
- Shadow, glow, border, gradient border, reflection, blur, glass transparency, depth, perspective, and rotation controls.
- Draggable arrows, circles, rectangles, underlines, labels, numbered markers, callouts, emoji, and stickers. Position sliders provide an alternative to dragging.
- Seventeen starting templates covering social posts, tutorials, comparisons, terminal output, SQL, JSON, API responses, and announcements.
- Social and aspect-ratio dimensions, custom sizes from 320 to 2400 px, and 1×–3× quality. Download PNG, JPEG, or editable project JSON. Set background opacity to zero for transparent PNGs.

Templates replace the current composition and can be undone. The preview reports when content may exceed the export dimensions. Font choices use local fonts and fall back when a family is unavailable. Blur is a visual treatment: original code remains in editable project files, so remove secrets before sharing those files.

## Visual canvas

Use the floating toolbar to select, pan, draw with pen/pencil/brush, erase whole objects, or insert rectangles, ellipses, triangles, diamonds, arrows, lines, text, notes, code, developer icons, and frames. Raster images can be uploaded and placed on the board. Code objects render TypeScript syntax colors.

- Drag an object to move it; use its corner handle or inspector dimensions to resize. Rotation, fills, gradient fills, strokes, opacity, fonts, sizes, and weight are in the inspector.
- Shift-click or drag a selection rectangle for multiple selection. Group, ungroup, align, distribute horizontally, and change stacking order. The Layers list selects obscured objects.
- Select an arrow and choose **Connect from** and **Connect to**. Endpoints follow shape boundaries as shapes move and rotate.
- Add a frame and use **Group frame contents** to move contained objects together. **Present frames** displays frames in layer order, with arrow-key navigation and Escape to exit.
- Add comments to selected objects. Comments are local project data.
- Wheel to zoom, use the hand to pan, and **Fit** to show the board. Optional snapping uses a 10px grid. Background choices are dots, grid, and plain.
- Architecture, flowchart, mind-map, and wireframe templates supply editable objects and attached connectors.
- Canvas exports include all objects independently of the current pan, zoom, or selection. Download PNG, SVG, or editable project JSON. Large PNGs are scaled to fit an 8192px maximum edge; SVG preserves vector geometry.

## Dev Tools

Browse 15,023 locally bundled icons from seven open-source collections, search by name, filter by collection, or use the Development filter for code, infrastructure, and developer logos. The grid loads 96 icons at a time; search covers the entire catalog. Exact duplicate artwork, hidden entries, and aliases are excluded from the count. Outline, filled, wordmark, and size variants are included as distinct artwork.

Select an icon, adjust size and (for stroked artwork) stroke width, and copy self-contained JSX, SVG, or a typed TSX component without an icon-package import. TSX exports a named default React component with `SVGProps<SVGSVGElement>`, uses the selected size and stroke as defaults, and accepts SVG props such as width, height, color, class name, and stroke width. Colored logos keep their fills, gradients, masks, and view boxes. Copies include the applicable license notice. Clipboard actions report success or failure and include a browser fallback; the JSX preview can also be selected manually. No separate npm package is published yet.

Icon names are indexed only when Dev Tools opens; SVG geometry is fetched from local, content-hashed collection files as needed and cached for the session. Browsing and copying require no external icon API. Failed loads have a retry action, and each rendered icon namespaces its SVG definitions to avoid gradient and mask collisions.

The import uses published open-source data from a pinned [Iconify icon-sets snapshot](https://github.com/iconify/icon-sets/tree/81ad501f19cc13e548e4cb6a9c63a3873c87262a). Original websites, authors, versions, SHA-256 checksums, and license URLs are recorded in [`public/icons/sources.json`](public/icons/sources.json); complete copyright and permission notices ship in [`public/icons/NOTICE.txt`](public/icons/NOTICE.txt). Product labels describe the styles; original source names remain in the provenance and required notices.

```sh
npm run icons:check    # Offline validation of all SVGs, counts, hashes and notices
npm run icons:collect  # Rebuild from the pinned sources; requires Python 3, curl and network
```

Update `scripts/icon-sources.json` deliberately to add a source or move to a newer snapshot. The importer accepts MIT/ISC collections, permits only static SVG elements and local references, and rejects executable content and external resources before writing assets. After rebuilding, run the checks and browser tests and remove any superseded collection files shown by Git.

Run `npx playwright test tests/devtools.spec.ts` to check browsing, direct routes, draft preservation, clipboard output, and the phone layout.

Each icon also has a shareable route at `/dev-tools/<collection-style>/<icon-name>`, for example `/dev-tools/outline/terminal` or `/dev-tools/developer-logos/vscode`. Tiles are real links, so opening them in a new tab works. Direct links and reloads select the same icon, browser Back/Forward tracks selections, and the breadcrumb returns to the library while keeping the current filters. **Copy icon link** copies its permanent URL. Unknown icon URLs show a missing-icon page with a link back to the library.

Run `npx playwright test tests/icon-routes.spec.ts tests/icon-tsx.spec.ts` for route uniqueness across the full catalog, direct navigation for every collection, mobile links, and strict TypeScript checks for exported components, including numeric icon names and colored logos.

## Local projects and sharing

The current card and canvas draft autosave to `localStorage`. **Save** adds or updates a named entry in **My projects**. Open, delete, import, or create projects from the library. Undo/redo history lasts for the current editing session; opening or importing another project starts a new history.

Download **Editable project** for a portable backup or to share a copy. Import the JSON file to resume editing. Projects use a versioned `flair` format with validated fields, geometry, and embedded images. PNG, JPEG, WebP, and GIF uploads are limited to 5 MB each; imported project files are limited to 20 MB. Browser storage quotas vary; storage errors are shown and project downloads remain available. Clearing site storage removes local drafts and library entries.

Optional **Live sharing between browser tabs** uses `BroadcastChannel`: open Flair in another tab in the same browser and origin, enable sharing, and use the same local room name. Updates replace the shared canvas state; the latest edit wins. This includes object comments. It does not synchronize across devices or provide multi-user accounts, conflict-free concurrent editing, or a hosted collaboration service.

## Shortcuts

| Action                             | Shortcut                      |
| ---------------------------------- | ----------------------------- |
| Save local project                 | Ctrl / Cmd S                  |
| Undo                               | Ctrl / Cmd Z                  |
| Redo                               | Ctrl / Cmd Shift Z, or Ctrl Y |
| Copy canvas selection              | Ctrl / Cmd C                  |
| Paste copied objects               | Ctrl / Cmd V                  |
| Duplicate selection                | Ctrl / Cmd D                  |
| Select all canvas objects          | Ctrl / Cmd A                  |
| Remove selection                   | Delete / Backspace            |
| Deselect / exit presentation       | Escape                        |
| Previous / next presentation frame | Left / Right arrow            |

Text fields retain their normal editing shortcuts.
