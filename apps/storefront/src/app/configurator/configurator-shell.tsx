'use client';

import * as React from 'react';
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@kartwerkz/ui';
import { SlidersHorizontal, Upload, X } from 'lucide-react';
import {
  ACCEPTED_ARTWORK_MIME_TYPES,
  isPreviewRenderable,
  LOGO_ELIGIBLE_REGIONS,
  MAX_UPLOAD_SIZE_BYTES,
  MaterialFinish,
  type BodyworkRegion,
} from '@kartwerkz/shared';
import {
  MAX_LOGOS,
  toKitConfiguration,
  useConfiguratorStore,
  type ConfiguratorPanel,
} from '@/stores/configurator-store';
import { ConfiguratorViewer } from '@/components/three/configurator-viewer';
import {
  useCreateConfiguration,
  useAddCartItem,
  useGraphicsDesigns,
  useKartModels,
  useProducts,
} from '@kartwerkz/api-client';
import { useRouter } from 'next/navigation';

const PANELS: Array<{ id: ConfiguratorPanel; label: string }> = [
  { id: 'kart', label: 'Kart' },
  { id: 'design', label: 'Design' },
  { id: 'colours', label: 'Colours' },
  { id: 'driver', label: 'Driver' },
  { id: 'logos', label: 'Logos' },
  { id: 'finish', label: 'Finish' },
];

/**
 * The actual two-column configurator chrome. Rendered by
 * app/configurator/page.tsx. Left = configuration panel (section
 * placeholders wired to the Zustand store). Right = preview panel —
 * the 3D viewer slots in later, see TODO(3d-viewer) below.
 *
 * This file owns layout/state wiring only. It does not render any 3D
 * content.
 */
export function ConfiguratorShell() {
  const store = useConfiguratorStore();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Desktop: persistent left config panel */}
      <aside className="hidden w-full max-w-md flex-shrink-0 border-r border-surface-border bg-surface lg:block">
        <ConfigPanelContent />
      </aside>

      {/* Mobile: collapsible bottom sheet trigger */}
      <div className="flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          {PANELS.find((p) => p.id === store.activePanel)?.label ?? 'Configure'}
        </p>
        <Sheet open={store.mobileSheetOpen} onOpenChange={store.setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Configure
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Configure Your Kit</SheetTitle>
            </SheetHeader>
            <ConfigPanelContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Preview panel */}
      <section className="relative min-h-[60vh] flex-1 bg-background lg:min-h-full">
        <ConfiguratorViewer />
      </section>
    </div>
  );
}

function ConfigPanelContent() {
  const store = useConfiguratorStore();

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <Tabs
        value={store.activePanel}
        onValueChange={(value) => store.setActivePanel(value as ConfiguratorPanel)}
      >
        <TabsList className="flex w-full flex-wrap">
          {PANELS.map((panel) => (
            <TabsTrigger key={panel.id} value={panel.id} className="flex-1">
              {panel.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="kart">
          <PanelSection
            title="Kart Model"
            description="Select your manufacturer and model so the livery is cut to fit. Only one demo rig exists today — every model below renders the same procedural geometry (see docs/configurator.md) — but the id selected here is the real database id, so saving/cart/checkout work end-to-end."
          >
            <KartModelPicker />
          </PanelSection>
        </TabsContent>

        <TabsContent value="design">
          <PanelSection
            title="Graphics Design"
            description="Start from a premade livery. Semi-custom and full-custom requests are handled by our design team after checkout (see special instructions below)."
          >
            <GraphicsDesignPicker />
          </PanelSection>
        </TabsContent>

        <TabsContent value="colours" className="space-y-5">
          <PanelSection
            title="Colours"
            description="Primary, secondary, and accent livery colours."
          >
            <div className="grid grid-cols-3 gap-3">
              {(['primary', 'secondary', 'accent'] as const).map((channel) => (
                <div key={channel} className="space-y-1.5">
                  <Label htmlFor={`colour-${channel}`} className="capitalize">
                    {channel}
                  </Label>
                  <input
                    id={`colour-${channel}`}
                    type="color"
                    value={store.colours[channel]}
                    onChange={(event) => store.setColour(channel, event.target.value)}
                    className="h-10 w-full cursor-pointer rounded border border-surface-border bg-surface"
                  />
                </div>
              ))}
            </div>
          </PanelSection>
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          <PanelSection title="Driver Details" description="Shown on the Nassau panel / side pods.">
            <div className="space-y-1.5">
              <Label htmlFor="driver-name">Name</Label>
              <Input
                id="driver-name"
                maxLength={24}
                value={store.driver.name ?? ''}
                onChange={(event) => store.setDriver({ name: event.target.value })}
                placeholder="e.g. M. SCHUMACHER"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driver-number">Race Number</Label>
              <Input
                id="driver-number"
                inputMode="numeric"
                maxLength={3}
                value={store.driver.number ?? ''}
                onChange={(event) => store.setDriver({ number: event.target.value })}
                placeholder="44"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driver-country">Country Code</Label>
              <Input
                id="driver-country"
                maxLength={2}
                value={store.driver.countryCode ?? ''}
                onChange={(event) =>
                  store.setDriver({ countryCode: event.target.value.toUpperCase() })
                }
                placeholder="SG"
              />
            </div>
          </PanelSection>
        </TabsContent>

        <TabsContent value="logos" className="space-y-4">
          <PanelSection
            title="Sponsor Logos"
            description={`Upload and place up to ${MAX_LOGOS} logos across eligible bodywork regions. PNG, JPEG, SVG, PDF, AI, or EPS.`}
          >
            <LogoUploadControl />
          </PanelSection>
        </TabsContent>

        <TabsContent value="finish" className="space-y-4">
          <PanelSection title="Material Finish" description="Affects both look and print cost.">
            <Select
              value={store.finish}
              onValueChange={(value) => store.setFinish(value as MaterialFinish)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MaterialFinish).map((finish) => (
                  <SelectItem key={finish} value={finish}>
                    {finish}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PanelSection>
        </TabsContent>
      </Tabs>

      <Separator />

      <PanelSection title="Special Instructions" description="Optional notes for our design team.">
        <Textarea
          maxLength={1000}
          value={store.specialInstructions}
          onChange={(event) => store.setSpecialInstructions(event.target.value)}
          placeholder="Anything we should know about this build?"
        />
      </PanelSection>

      <AddToCartControl />
    </div>
  );
}

/**
 * Local file-preview logo uploads. This intentionally does NOT call
 * `POST /uploads` — it reads the file client-side (object URL) purely so
 * the 3D preview has something to render immediately. A real submission
 * still requires uploading through `@kartwerkz/api-client`'s
 * `useUploadAsset()` (private storage, MIME/size validation, malware-scan
 * queue) before checkout; wiring that hand-off is tracked as follow-up
 * work once the API is reachable from this environment.
 */
function LogoUploadControl() {
  const store = useConfiguratorStore();
  const [error, setError] = React.useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    if (
      !ACCEPTED_ARTWORK_MIME_TYPES.includes(
        file.type as (typeof ACCEPTED_ARTWORK_MIME_TYPES)[number],
      )
    ) {
      setError('Unsupported file type. Use PNG, JPEG, SVG, PDF, AI, or EPS.');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError('File is too large (max 25MB).');
      return;
    }

    const previewable = isPreviewRenderable(file.type);
    // Never inline untrusted SVG markup as live DOM — always treat uploads as
    // opaque image bitmaps via object URL + <img>/texture loader, never dangerouslySetInnerHTML.
    const previewUrl = previewable ? URL.createObjectURL(file) : undefined;

    const added = store.addLogo(
      {
        uploadedAssetId: `local:${crypto.randomUUID()}`,
        bodyworkRegion: LOGO_ELIGIBLE_REGIONS[0] as BodyworkRegion,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotationDegrees: 0,
      },
      previewUrl,
    );
    if (!added) {
      setError(`Maximum of ${MAX_LOGOS} logos reached.`);
    } else if (!previewable) {
      setError(
        "Uploaded — this format needs manual artwork prep and won't render in the live preview.",
      );
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-surface-border bg-surface-raised px-3 py-6 text-sm text-foreground-muted hover:border-accent/60">
        <Upload className="h-4 w-4" aria-hidden="true" />
        Upload a logo
        <input
          type="file"
          accept={ACCEPTED_ARTWORK_MIME_TYPES.join(',')}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = '';
          }}
        />
      </label>
      {error ? <p className="text-xs text-warning">{error}</p> : null}

      <p className="text-xs text-foreground-muted">
        {store.logos.length} / {MAX_LOGOS} placed
      </p>

      <ul className="space-y-2">
        {store.logos.map((logo, index) => (
          <li
            key={logo.uploadedAssetId}
            className="rounded border border-surface-border p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <Select
                value={logo.bodyworkRegion}
                onValueChange={(value) => store.updateLogo(index, { bodyworkRegion: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOGO_ELIGIBLE_REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                aria-label="Remove logo"
                onClick={() => store.removeLogo(index)}
                className="rounded p-1 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <label className="space-y-1">
                <span className="text-foreground-muted">X</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={logo.x}
                  onChange={(e) => store.updateLogo(index, { x: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="space-y-1">
                <span className="text-foreground-muted">Y</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={logo.y}
                  onChange={(e) => store.updateLogo(index, { y: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="space-y-1">
                <span className="text-foreground-muted">Scale</span>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.05}
                  value={logo.scale}
                  onChange={(e) => store.updateLogo(index, { scale: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KartModelPicker() {
  const store = useConfiguratorStore();
  const { data: models, isLoading, isError } = useKartModels();

  if (isLoading) {
    return <p className="text-sm text-foreground-muted">Loading kart models…</p>;
  }
  if (isError || !models || models.length === 0) {
    return (
      <p className="text-sm text-warning">
        Couldn&apos;t load kart models from the API. Make sure the backend is running and seeded (
        <code className="rounded bg-surface-raised px-1 py-0.5 text-xs">pnpm db:seed</code>).
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {models.map((model) => (
        <button
          key={model.id}
          type="button"
          onClick={() => store.setKartModel(model.id)}
          className={`flex items-center justify-between rounded border px-3 py-2 text-left text-sm transition-colors ${
            store.kartModelId === model.id
              ? 'border-accent bg-surface-raised text-foreground'
              : 'border-surface-border text-foreground-muted hover:border-accent/50'
          }`}
        >
          <span>
            {model.manufacturer?.name ?? 'Unknown'} — {model.name}
          </span>
          {store.kartModelId === model.id ? <Badge variant="accent">Selected</Badge> : null}
        </button>
      ))}
    </div>
  );
}

function GraphicsDesignPicker() {
  const store = useConfiguratorStore();
  const { data: designs, isLoading, isError } = useGraphicsDesigns();

  if (isLoading) {
    return <p className="text-sm text-foreground-muted">Loading graphics designs…</p>;
  }
  if (isError || !designs || designs.length === 0) {
    return (
      <p className="text-sm text-warning">
        Couldn&apos;t load graphics designs from the API. Make sure the backend is running and
        seeded.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {designs.map((design) => {
        const colours = design.defaultColours;
        return (
          <button
            key={design.id}
            type="button"
            onClick={() => {
              store.setGraphicsDesign(design.id, design.slug);
              store.setColour('primary', colours.primary);
              store.setColour('secondary', colours.secondary);
              store.setColour('accent', colours.accent);
            }}
            className={`flex items-center gap-3 rounded border px-3 py-2 text-left text-sm transition-colors ${
              store.graphicsDesignId === design.id
                ? 'border-accent bg-surface-raised text-foreground'
                : 'border-surface-border text-foreground-muted hover:border-accent/50'
            }`}
          >
            <span className="flex h-8 w-12 shrink-0 overflow-hidden rounded border border-surface-border">
              <span className="h-full w-1/3" style={{ backgroundColor: colours.primary }} />
              <span className="h-full w-1/3" style={{ backgroundColor: colours.secondary }} />
              <span className="h-full w-1/3" style={{ backgroundColor: colours.accent }} />
            </span>
            {design.name}
            {design.isDemo ? (
              <Badge variant="outline" className="text-[10px]">
                Demo
              </Badge>
            ) : null}
            {store.graphicsDesignId === design.id ? (
              <Badge variant="accent" className="ml-auto">
                Selected
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Creates a SavedConfiguration from the current store state, adds it to the
 * cart, and redirects to /cart. This is the one place the configurator
 * talks to the API for real — everything else is local state until this
 * point, matching the product spec's "save/edit freely, only persist on
 * explicit action" model.
 */
function AddToCartControl() {
  const store = useConfiguratorStore();
  const router = useRouter();
  const { data: products } = useProducts();
  const createConfiguration = useCreateConfiguration();
  const addCartItem = useAddCartItem();
  const [error, setError] = React.useState<string | null>(null);

  const isPending = createConfiguration.isPending || addCartItem.isPending;

  const handleClick = async () => {
    setError(null);
    const configuration = toKitConfiguration(store);
    if (!configuration) {
      setError('Select a kart model and a graphics design first.');
      store.setActivePanel('kart');
      return;
    }
    const product = products?.[0];
    if (!product) {
      setError('Could not load the product — the API may be unreachable.');
      return;
    }
    try {
      const saved = await createConfiguration.mutateAsync({ configuration });
      await addCartItem.mutateAsync({
        productId: product.id,
        savedConfigurationId: saved.id,
        quantity: 1,
      });
      router.push('/cart');
    } catch {
      setError('Could not add this kit to your cart. Please try again.');
    }
  };

  return (
    <div className="mt-auto space-y-2">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        loading={isPending}
        onClick={handleClick}
      >
        ADD TO CART
      </Button>
    </div>
  );
}

function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs text-foreground-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
