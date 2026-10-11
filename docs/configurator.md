# Configurator & 3D asset pipeline

## Current state: honest disclosure

The homepage animation and `/configurator` render a real, textured GLB
(`apps/storefront/public/models/kartwerkz-blue-red.glb`, revision 2 of the
upstream kit — a visual refresh of bumper/sidepod/fairing/seat/engine
geometry, ~106k triangles, ~5.1MB) via the `KartViewer` package in
`apps/storefront/src/components/kart/`. This is a **photo-derived
approximation of a generic kart chassis, not manufacturer CAD and not a
specific real manufacturer's kart** — the viewer's own upstream README
states this explicitly. Do not present it to customers as representing a
specific real manufacturer's product. It is a materially better asset than
the procedural primitive rig used earlier in this project's history, but
the same disclosure obligation applies.

## How appearance is driven

Unlike the original design (per-region GLTF material swap driven by DB
`GraphicsAsset` rows), the integrated viewer takes a single `KartAppearance`
object and _generates_ its livery as five 1024px canvas textures at runtime
(`components/kart/graphics.ts#applyAppearance`), one per bodywork panel:

```ts
interface KartAppearance {
  bodyColor: string; // hex
  accentColor: string;
  inkColor: string;
  driverName: string;
  number: string;
  finish: 'gloss' | 'matte' | 'chrome' | 'holographic';
  wrapProgress: number; // 0 (plain) – 1 (fully wrapped)
  panelArtwork?: Partial<Record<PanelName, CanvasImageSource>>;
  logo?: CanvasImageSource;
}
```

Any appearance change rebuilds all five canvas textures and re-uploads them,
so callers that animate continuously (the homepage scroll reveal) must
quantize `wrapProgress` rather than feeding it a raw per-frame scroll value —
see `WRAP_STEPS` / `quantize()` in `kart-hero-scene.tsx` (40 steps).

## Bodywork region naming mismatch (known, intentional)

The viewer's panel identifiers do **not** match the backend's
`@kartwerkz/shared/bodywork.ts` region identifiers:

| Backend (`BodyworkRegion`) | Viewer (`PanelName`) |
| -------------------------- | -------------------- |
| `front_fairing`            | `front-bumper`       |
| `nassau_panel`             | `nassau-panel`       |
| `left_sidepod`             | `sidepod-left`       |
| `right_sidepod`            | `sidepod-right`      |
| `rear_bumper`              | `rear-bumper`        |

No mapping layer exists yet. The live-rendered preview does not read
per-region `GraphicsAsset` rows at all (see below); the mismatch only
matters if/when panel-level artwork is wired into the viewer. Anyone doing
that work must translate between the two naming schemes explicitly.

## Live-preview fidelity vs. persisted data (known limitation)

The configurator persists the full data model the original spec calls
for — `GraphicsDesign`/`SavedConfiguration`, multiple logo uploads with
per-panel placement, etc. — via the API exactly as before. However, the
live Three.js preview only reflects a subset of that data:

- **Colours**: `GraphicsDesign.colours.{primary,secondary,accent}` map
  directly to `bodyColor`/`accentColor`/`inkColor`. Full fidelity.
- **Driver name/number**: full fidelity, rendered via canvas text.
- **Finish**: full fidelity (see below).
- **Logos**: only the **first** uploaded logo is decoded and stamped onto
  the canvas textures for live preview (`configurator-viewer-scene.tsx`,
  `useDecodedImage`). All uploaded logos and their placements are still
  recorded and sent to the API/admin for manual artwork prep regardless —
  this is a preview-fidelity gap, not a data-loss gap.
- **Per-panel custom artwork** (`panelArtwork`): plumbed through by the
  viewer package but not currently populated from any configurator state;
  panels render the generated diagonal livery graphic described above.

## Material finish

`MaterialFinish` (GLOSS/MATTE/CHROME/HOLOGRAPHIC) maps to
`MeshPhysicalMaterial` presets via `applyFinish()` in `graphics.ts`. GLOSS
and MATTE are native to the upstream viewer package; CHROME and HOLOGRAPHIC
were added in this project (high metalness/low roughness/clearcoat for
chrome; iridescence enabled for holographic) and are explicitly a rougher
approximation than the other two — call this out if the finish selector UI
copy is revisited.

## Logo placement (server-side contract, unchanged)

Enforced server-side in the `configurations` module (never trust
client-submitted placement bounds):

- A logo may only be placed on a `LOGO_ELIGIBLE_REGIONS` entry.
- `x`/`y` ∈ [0,1], `scale` ∈ [0.1, 3], `rotationDegrees` ∈ [-180, 180] — see
  `LogoPlacementSchema` in `@kartwerkz/shared/configuration.ts`.
- Maximum 6 logo placements per configuration.
- The _preview_ placement is not guaranteed pixel-identical to the final
  printed artwork — production files are prepared manually by an admin
  (artwork proof workflow) against the supplier's actual templates, bleed,
  and cutline requirements. The configurator UI says so explicitly next to
  the upload control. This is now doubly true given only one logo is even
  live-previewed (see above).

## Schema versioning

The wire format for a configuration is `KitConfiguration`
(`@kartwerkz/shared/configuration.ts`), tagged `schemaVersion`. Current
version: `1`. When the shape must change:

1. Add `KitConfigurationV2Schema`, keep `V1Schema` exported (don't delete it).
2. Add a `migrateV1ToV2()` pure function.
3. `KitConfigurationSchema` becomes a discriminated union on `schemaVersion`
   resolved to the latest at read time; stored `OrderItem.configurationSnapshot`
   JSON keeps whatever version it was written with, since it's a historical
   receipt and must never be silently rewritten.

## Performance

- `KartViewer` renders with `frameloop="demand"` (R3F only re-renders on
  state/control changes, not continuously) and `dpr={[1, 1.75]}`.
- The R3F canvas components (`kart-hero-scene.tsx`,
  `configurator-viewer-scene.tsx`) are client components dynamically
  loaded by their parent pages to keep Three.js out of the initial bundle
  for non-3D routes.
- `prefers-reduced-motion` disables the scroll-driven camera/wrap animation
  on the homepage in favor of an immediately fully-wrapped kart
  (`wrapProgress: 1`), with `autoRotate` also disabled.
- Mobile uses a touch-friendly design carousel instead of hover-driven
  design switching on the homepage hero.
- `enableZoom={false}` on the homepage hero viewer (scroll drives the pin
  animation, not camera distance); the configurator viewer leaves zoom on
  and exposes a "Reset Camera" control that remounts the canvas (the
  package has no imperative camera-reset API — see `resetSignal` key trick
  in `configurator-viewer-scene.tsx`).
