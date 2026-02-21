"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { TypingHeading } from "@/components/dashboard/TypingHeading";
import { DashboardChatInput } from "@/components/dashboard/DashboardChatInput";
import { ProjectTabs } from "@/components/dashboard/ProjectTabs";
import {
  ArrowLeft,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Mail,
  Plus,
  Search,
  Trash2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const SECTIONS = [
  { id: "logo", label: "Logo" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "cards", label: "Cards" },
  { id: "avatars", label: "Avatars" },
  { id: "tabs", label: "Tabs" },
  { id: "dropdown", label: "Dropdown Menu" },
  { id: "dashboard", label: "Dashboard Components" },
  { id: "animations", label: "Animations" },
];

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div id={id} className="scroll-mt-8">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 h-px bg-border" />
    </div>
  );
}

function Swatch({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 w-full rounded-lg border ${className}`} />
      <p className="text-xs font-medium">{label}</p>
      <p className="font-mono text-[10px] text-muted-foreground">{value}</p>
    </div>
  );
}

function ComponentShowcase({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="rounded-xl border bg-card p-6">{children}</div>
    </div>
  );
}

function PropsTable({ rows }: { rows: { prop: string; type: string; default?: string; description: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-medium">Prop</th>
            <th className="px-4 py-2 text-left font-medium">Type</th>
            <th className="px-4 py-2 text-left font-medium">Default</th>
            <th className="px-4 py-2 text-left font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.prop} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono text-xs text-primary">{row.prop}</td>
              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{row.type}</td>
              <td className="px-4 py-2 font-mono text-xs">{row.default ?? "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const MOCK_PROJECTS = [
  { id: "1", name: "Todo App", template: "node", updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: "2", name: "SaaS Dashboard", template: "node", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "3", name: "Landing Page", template: "node", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "4", name: "Chat Application", template: "node", updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

export default function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState("colors");

  return (
    <div className="flex min-h-screen">
      {/* Sticky sidebar nav */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r bg-card p-4 lg:block">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mb-1 text-lg font-bold">Design System</h1>
        <p className="mb-6 text-xs text-muted-foreground">AppMake component guide</p>
        <nav className="space-y-0.5">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                activeSection === s.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-6 py-3 backdrop-blur-sm lg:hidden">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-bold">Design System</h1>
        </div>

        <div className="mx-auto max-w-4xl space-y-16 px-6 py-10">
          {/* ============ LOGO ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="logo"
              title="Logo"
              description="AppMake logo variants — full wordmark and icon-only, in dark and light mode."
            />

            <ComponentShowcase title="Full Logo (Dark Background)">
              <div className="flex items-center justify-center rounded-lg bg-[#0f0f14] p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-dark.svg" alt="AppMake logo dark" className="h-12" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                /logo-dark.svg · mix-blend-mode: screen · Text: #EBEDF2
              </p>
            </ComponentShowcase>

            <ComponentShowcase title="Full Logo (Light Background)">
              <div className="flex items-center justify-center rounded-lg bg-white p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-light.svg" alt="AppMake logo light" className="h-12" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                /logo-light.svg · mix-blend-mode: multiply · Text: #1E2028
              </p>
            </ComponentShowcase>

            <ComponentShowcase title="Icon Only">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center rounded-lg bg-[#0f0f14] p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-dark.svg" alt="AppMake icon dark" className="h-12 w-12" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">icon-dark.svg</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center rounded-lg bg-white p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-light.svg" alt="AppMake icon light" className="h-12 w-12" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">icon-light.svg</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center rounded-lg bg-white p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/favicon.svg" alt="AppMake favicon" className="h-8 w-8" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">favicon.svg (32px)</p>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Logo Anatomy">
              <div className="space-y-3 text-sm">
                <p>The AppMake icon consists of four overlapping circles with blend modes:</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full" style={{ background: "#EC4899" }} />
                    <span className="font-mono text-xs">#EC4899</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full" style={{ background: "#6366F1" }} />
                    <span className="font-mono text-xs">#6366F1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full" style={{ background: "#F59E0B" }} />
                    <span className="font-mono text-xs">#F59E0B</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full" style={{ background: "#EC4899", opacity: 0.68 }} />
                    <span className="font-mono text-xs">#EC4899 @ 68%</span>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Dark variant uses <code className="rounded bg-muted px-1 py-0.5 text-xs">mix-blend-mode: screen</code>,
                  light variant uses <code className="rounded bg-muted px-1 py-0.5 text-xs">mix-blend-mode: multiply</code>.
                  Wordmark set in DM Sans, 48px, weight 500, letter-spacing -2.
                </p>
              </div>
            </ComponentShowcase>
          </section>

          {/* ============ COLORS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="colors"
              title="Colors"
              description="CSS custom properties used throughout the app. Shown in light and dark mode."
            />

            <ComponentShowcase title="Theme Colors (CSS Variables)">
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                <Swatch label="Background" value="--background" className="bg-background" />
                <Swatch label="Foreground" value="--foreground" className="bg-foreground" />
                <Swatch label="Primary" value="--primary" className="bg-primary" />
                <Swatch label="Secondary" value="--secondary" className="bg-secondary" />
                <Swatch label="Muted" value="--muted" className="bg-muted" />
                <Swatch label="Accent" value="--accent" className="bg-accent" />
                <Swatch label="Destructive" value="--destructive" className="bg-destructive" />
                <Swatch label="Border" value="--border" className="bg-border" />
                <Swatch label="Card" value="--card" className="bg-card" />
                <Swatch label="Popover" value="--popover" className="bg-popover" />
                <Swatch label="Input" value="--input" className="bg-input" />
                <Swatch label="Ring" value="--ring" className="bg-ring" />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Chart Colors">
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Swatch key={n} label={`Chart ${n}`} value={`--chart-${n}`} className={`bg-chart-${n}`} />
                ))}
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Dashboard Colors">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <div className="h-14 w-full rounded-lg" style={{ background: "#1a0533" }} />
                  <p className="text-xs font-medium">Deep Purple</p>
                  <p className="font-mono text-[10px] text-muted-foreground">#1a0533</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-14 w-full rounded-lg" style={{ background: "#0a1628" }} />
                  <p className="text-xs font-medium">Dark Navy</p>
                  <p className="font-mono text-[10px] text-muted-foreground">#0a1628</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-14 w-full rounded-lg" style={{ background: "#ff1493" }} />
                  <p className="text-xs font-medium">Hot Pink</p>
                  <p className="font-mono text-[10px] text-muted-foreground">#ff1493</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-14 w-full rounded-lg" style={{ background: "#c2185b" }} />
                  <p className="text-xs font-medium">Deep Pink</p>
                  <p className="font-mono text-[10px] text-muted-foreground">#c2185b</p>
                </div>
              </div>
            </ComponentShowcase>
          </section>

          {/* ============ TYPOGRAPHY ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="typography"
              title="Typography"
              description="Custom font system: Inter Tight (primary), Inter (body), Founders Grotesk X Condensed (display), Caveat (handwriting), Geist Mono (code)."
            />

            <ComponentShowcase title="Font Families">
              <div className="space-y-6">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Inter Tight — Primary / Default (font-sans)</p>
                  <p className="text-2xl font-sans">The quick brown fox jumps over the lazy dog</p>
                  <p className="mt-1 text-sm font-sans font-light">Light 300</p>
                  <p className="mt-0.5 text-sm font-sans font-normal">Regular 400</p>
                  <p className="mt-0.5 text-sm font-sans font-medium">Medium 500</p>
                  <p className="mt-0.5 text-sm font-sans font-semibold">Semibold 600</p>
                  <p className="mt-0.5 text-sm font-sans font-bold">Bold 700</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Inter — Body text (font-body)</p>
                  <p className="text-2xl font-body">The quick brown fox jumps over the lazy dog</p>
                  <p className="mt-1 text-sm font-body font-light">Light 300</p>
                  <p className="mt-0.5 text-sm font-body font-normal">Regular 400</p>
                  <p className="mt-0.5 text-sm font-body font-medium">Medium 500</p>
                  <p className="mt-0.5 text-sm font-body font-semibold">Semibold 600</p>
                  <p className="mt-0.5 text-sm font-body font-bold">Bold 700</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Founders Grotesk X Condensed — Display headlines (font-display)</p>
                  <p className="text-5xl font-display font-bold uppercase leading-tight">The quick brown fox</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Caveat — Handwriting accents (font-hand)</p>
                  <p className="text-3xl font-hand">The quick brown fox jumps over the lazy dog</p>
                  <p className="mt-1 text-lg font-hand font-normal">Regular 400</p>
                  <p className="mt-0.5 text-lg font-hand font-semibold">Semibold 600</p>
                  <p className="mt-0.5 text-lg font-hand font-bold">Bold 700</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Geist Mono — Code / monospace (font-mono)</p>
                  <p className="text-2xl font-mono">The quick brown fox jumps over the lazy dog</p>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Font Usage Guide">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">Class</th>
                      <th className="px-4 py-2 text-left font-medium">Font</th>
                      <th className="px-4 py-2 text-left font-medium">CSS Variable</th>
                      <th className="px-4 py-2 text-left font-medium">Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs text-primary">font-sans</td>
                      <td className="px-4 py-2 text-xs">Inter Tight</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">--font-sans</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">Default UI, headings, nav, buttons</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs text-primary">font-body</td>
                      <td className="px-4 py-2 text-xs">Inter</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">--font-body</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">Long-form body text, paragraphs</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs text-primary">font-display</td>
                      <td className="px-4 py-2 text-xs">Founders Grotesk X Condensed</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">--font-display</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">Hero headlines, large display text (uppercase)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs text-primary">font-hand</td>
                      <td className="px-4 py-2 text-xs">Caveat</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">--font-hand</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">Handwriting accents, annotations</td>
                    </tr>
                    <tr className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs text-primary">font-mono</td>
                      <td className="px-4 py-2 text-xs">Geist Mono</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">--font-mono</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">Code, file paths, terminal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Heading Sizes">
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground">Display — font-display uppercase (hero)</span>
                  <h1 className="text-7xl font-display font-bold uppercase leading-none">Display</h1>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">6xl (60px)</span>
                  <h1 className="text-6xl font-bold tracking-tight">Heading 6XL</h1>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">5xl (48px)</span>
                  <h1 className="text-5xl font-bold tracking-tight">Heading 5XL</h1>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">4xl (36px)</span>
                  <h1 className="text-4xl font-bold tracking-tight">Heading 4XL</h1>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">3xl (30px)</span>
                  <h2 className="text-3xl font-bold">Heading 3XL</h2>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">2xl (24px)</span>
                  <h2 className="text-2xl font-bold">Heading 2XL</h2>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">xl (20px)</span>
                  <h3 className="text-xl font-semibold">Heading XL</h3>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">lg (18px)</span>
                  <h3 className="text-lg font-semibold">Heading LG</h3>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">base (16px)</span>
                  <p className="text-base">Body text — base size</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">sm (14px)</span>
                  <p className="text-sm">Small text</p>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Text Styles">
              <div className="space-y-3">
                <p className="text-foreground">Default foreground text (Inter Tight)</p>
                <p className="text-muted-foreground">Muted foreground text</p>
                <p className="font-body text-foreground">Body text in Inter (font-body)</p>
                <p className="font-display text-2xl font-bold uppercase">Display text (font-display)</p>
                <p className="font-hand text-xl">Handwritten accent (font-hand)</p>
                <p className="font-mono text-sm bg-muted inline-block rounded px-2 py-0.5">Inline code (font-mono)</p>
              </div>
            </ComponentShowcase>
          </section>

          {/* ============ BUTTONS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="buttons"
              title="Buttons"
              description="All button variants and sizes."
            />

            <ComponentShowcase title="Variants">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Sizes">
              <div className="flex flex-wrap items-end gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Icon Buttons">
              <div className="flex flex-wrap items-end gap-3">
                <Button size="icon-xs"><Plus className="h-3 w-3" /></Button>
                <Button size="icon-sm"><Plus className="h-4 w-4" /></Button>
                <Button size="icon"><Plus className="h-4 w-4" /></Button>
                <Button size="icon-lg"><Plus className="h-4 w-4" /></Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Icons">
              <div className="flex flex-wrap gap-3">
                <Button><Mail className="h-4 w-4" /> Send Email</Button>
                <Button variant="outline"><Search className="h-4 w-4" /> Search</Button>
                <Button variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="States">
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>Disabled Outline</Button>
              </div>
            </ComponentShowcase>

            <PropsTable
              rows={[
                { prop: "variant", type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', default: '"default"', description: "Visual style of the button" },
                { prop: "size", type: '"default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"', default: '"default"', description: "Size of the button" },
                { prop: "asChild", type: "boolean", default: "false", description: "Merge props onto child element instead of rendering a button" },
              ]}
            />
          </section>

          {/* ============ INPUTS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="inputs"
              title="Inputs"
              description="Text inputs, textareas, and the dashboard glassmorphism chat input."
            />

            <ComponentShowcase title="Standard Input">
              <div className="max-w-sm space-y-3">
                <Input placeholder="Default input" />
                <Input placeholder="Disabled input" disabled />
                <Input type="password" placeholder="Password input" />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Textarea">
              <div className="max-w-sm">
                <Textarea placeholder="Write something here..." />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Dashboard Chat Input (Glassmorphism)">
              <div className="rounded-xl bg-gradient-to-br from-[#1a0533] to-[#0a1628] p-8">
                <div className="relative mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md">
                  <textarea
                    rows={1}
                    readOnly
                    className="w-full resize-none bg-transparent px-5 py-4 pr-14 text-white placeholder-white/40 outline-none"
                    placeholder="Build a todo app with drag-and-drop..."
                  />
                  <button className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                  </button>
                </div>
                <p className="mt-3 text-center text-xs text-white/30">
                  border-white/15 · bg-white/5 · backdrop-blur-md
                </p>
              </div>
            </ComponentShowcase>

            <PropsTable
              rows={[
                { prop: "type", type: "string", default: '"text"', description: "Input type (text, password, email, etc.)" },
                { prop: "placeholder", type: "string", description: "Placeholder text" },
                { prop: "disabled", type: "boolean", default: "false", description: "Disable the input" },
              ]}
            />
          </section>

          {/* ============ CARDS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="cards"
              title="Cards"
              description="Standard shadcn Card and dashboard glassmorphism project card."
            />

            <ComponentShowcase title="Standard Card">
              <div className="max-w-sm">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description with supporting text.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">This is the card content area. You can put any content here.</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Dashboard Project Card (Glassmorphism)">
              <div className="rounded-xl bg-gradient-to-br from-[#1a0533] to-[#0a1628] p-8">
                <div className="grid max-w-lg grid-cols-2 gap-3">
                  {["Todo App", "Dashboard"].map((name) => (
                    <div
                      key={name}
                      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex h-20 items-center justify-center rounded-lg bg-white/5">
                        <MessageSquare className="h-6 w-6 text-white/30" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-white/40">2h ago</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/30">
                  border-white/10 · bg-white/5 · backdrop-blur-sm
                </p>
              </div>
            </ComponentShowcase>

            <PropsTable
              rows={[
                { prop: "CardHeader", type: "component", description: "Contains title, description, and optional action" },
                { prop: "CardTitle", type: "component", description: "The card heading" },
                { prop: "CardDescription", type: "component", description: "Supporting text below the title" },
                { prop: "CardAction", type: "component", description: "Action slot in the header, auto-positioned top-right" },
                { prop: "CardContent", type: "component", description: "Main content area" },
                { prop: "CardFooter", type: "component", description: "Footer area with flex layout" },
              ]}
            />
          </section>

          {/* ============ AVATARS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="avatars"
              title="Avatars"
              description="Avatar with image fallback, initials, sizes, badges, and groups."
            />

            <ComponentShowcase title="Sizes">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Avatar size="sm">
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 text-xs text-muted-foreground">sm</p>
                </div>
                <div className="text-center">
                  <Avatar size="default">
                    <AvatarFallback>DF</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 text-xs text-muted-foreground">default</p>
                </div>
                <div className="text-center">
                  <Avatar size="lg">
                    <AvatarFallback>LG</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 text-xs text-muted-foreground">lg</p>
                </div>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Image & Fallback">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage src="/broken-image.png" />
                  <AvatarFallback className="bg-violet-600 text-white">AB</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-pink-600 text-white">JD</AvatarFallback>
                </Avatar>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Badge">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-violet-600 text-white">ON</AvatarFallback>
                  <AvatarBadge className="bg-green-500" />
                </Avatar>
                <Avatar size="lg">
                  <AvatarFallback className="bg-pink-600 text-white">PR</AvatarFallback>
                  <AvatarBadge className="bg-yellow-500" />
                </Avatar>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Avatar Group">
              <AvatarGroup>
                <Avatar>
                  <AvatarFallback className="bg-violet-600 text-white">A</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-pink-600 text-white">B</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">C</AvatarFallback>
                </Avatar>
                <AvatarGroupCount>+3</AvatarGroupCount>
              </AvatarGroup>
            </ComponentShowcase>

            <PropsTable
              rows={[
                { prop: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Avatar size (6/8/10)" },
                { prop: "AvatarImage", type: "component", description: "Image that auto-hides on error" },
                { prop: "AvatarFallback", type: "component", description: "Shown while image loads or on error" },
                { prop: "AvatarBadge", type: "component", description: "Small status indicator dot" },
                { prop: "AvatarGroup", type: "component", description: "Overlapping avatar stack" },
              ]}
            />
          </section>

          {/* ============ TABS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="tabs"
              title="Tabs"
              description="Tab components with default and line variants."
            />

            <ComponentShowcase title="Default Variant">
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1">Account</TabsTrigger>
                  <TabsTrigger value="tab2">Password</TabsTrigger>
                  <TabsTrigger value="tab3">Notifications</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="mt-4">
                  <p className="text-sm text-muted-foreground">Account settings content goes here.</p>
                </TabsContent>
                <TabsContent value="tab2" className="mt-4">
                  <p className="text-sm text-muted-foreground">Password settings content goes here.</p>
                </TabsContent>
                <TabsContent value="tab3" className="mt-4">
                  <p className="text-sm text-muted-foreground">Notification preferences go here.</p>
                </TabsContent>
              </Tabs>
            </ComponentShowcase>

            <ComponentShowcase title="Line Variant">
              <Tabs defaultValue="recent">
                <TabsList variant="line">
                  <TabsTrigger value="recent">Recently viewed</TabsTrigger>
                  <TabsTrigger value="mine">My projects</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                <TabsContent value="recent" className="mt-4">
                  <p className="text-sm text-muted-foreground">Recently viewed projects.</p>
                </TabsContent>
                <TabsContent value="mine" className="mt-4">
                  <p className="text-sm text-muted-foreground">Your projects.</p>
                </TabsContent>
                <TabsContent value="templates" className="mt-4">
                  <p className="text-sm text-muted-foreground">Templates coming soon.</p>
                </TabsContent>
              </Tabs>
            </ComponentShowcase>

            <ComponentShowcase title="Dashboard ProjectTabs">
              <div className="rounded-xl bg-gradient-to-br from-[#1a0533] to-[#0a1628] p-8">
                <ProjectTabs projects={MOCK_PROJECTS} />
              </div>
            </ComponentShowcase>

            <PropsTable
              rows={[
                { prop: "variant (TabsList)", type: '"default" | "line"', default: '"default"', description: "Visual style: pill background or underline indicator" },
                { prop: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Layout direction" },
                { prop: "defaultValue", type: "string", description: "Initially active tab value" },
              ]}
            />
          </section>

          {/* ============ DROPDOWN ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="dropdown"
              title="Dropdown Menu"
              description="Context menus and dropdown actions."
            />

            <ComponentShowcase title="Standard Dropdown">
              <div className="flex gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Open Menu <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Workspace Dropdown (Dashboard Style)">
              <div className="inline-flex rounded-lg bg-[#0f0f14] p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium text-white outline-none">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-violet-600 text-xs text-white">J</AvatarFallback>
                    </Avatar>
                    <span>John&apos;s workspace</span>
                    <ChevronDown className="h-3 w-3 text-white/40" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="px-2 py-1.5 text-sm">
                      <p className="font-medium">John Doe</p>
                      <p className="text-xs text-muted-foreground">john@example.com</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </ComponentShowcase>

            <PropsTable
              rows={[
                { prop: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alignment relative to trigger" },
                { prop: "sideOffset", type: "number", default: "4", description: "Distance from the trigger" },
                { prop: "variant (item)", type: '"default" | "destructive"', default: '"default"', description: "Visual style of menu item" },
                { prop: "inset", type: "boolean", default: "false", description: "Add left padding for icon alignment" },
              ]}
            />
          </section>

          {/* ============ DASHBOARD COMPONENTS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="dashboard"
              title="Dashboard Components"
              description="Custom components used in the main dashboard."
            />

            <ComponentShowcase title="MeshGradientBackground">
              <div className="relative h-64 overflow-hidden rounded-lg">
                <div className="absolute inset-0">
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        "radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #ff1493 0%, transparent 40%), radial-gradient(ellipse at 60% 80%, #c2185b 0%, transparent 40%), #0a1628",
                    }}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background/90" />
                <div className="relative flex h-full items-center justify-center">
                  <p className="text-sm text-white/60">CSS fallback shown — WebGL version uses @paper-design/shaders-react</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Colors: #1a0533, #0a1628, #ff1493, #c2185b · Speed: 0.3 · Bottom fade overlay for smooth transition
              </p>
            </ComponentShowcase>

            <ComponentShowcase title="TypingHeading">
              <div className="rounded-lg bg-gradient-to-br from-[#1a0533] to-[#0a1628] p-8">
                <TypingHeading name="Designer" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Props: name (string) · 40ms typing interval · Blinking cursor pulses when complete
              </p>
            </ComponentShowcase>

            <ComponentShowcase title="DashboardChatInput">
              <div className="rounded-lg bg-gradient-to-br from-[#1a0533] to-[#0a1628] p-8">
                <div className="flex justify-center">
                  <DashboardChatInput />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Rotating placeholders · Auto-resize textarea (max 160px) · Enter to submit, Shift+Enter for newline
              </p>
            </ComponentShowcase>

            <ComponentShowcase title="ProjectTabs">
              <div className="rounded-lg bg-gradient-to-br from-[#1a0533] to-[#0a1628] p-8">
                <ProjectTabs projects={MOCK_PROJECTS} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                3 tabs: Recently viewed, My projects, Templates · Grid: 2 cols → 3 → 4 · Time-ago formatting
              </p>
            </ComponentShowcase>
          </section>

          {/* ============ ANIMATIONS ============ */}
          <section className="space-y-6">
            <SectionHeading
              id="animations"
              title="Animations"
              description="Keyframe animations defined in globals.css."
            />

            <ComponentShowcase title="shimmer">
              <div className="relative h-12 overflow-hidden rounded-lg bg-muted">
                <div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{ animation: "shimmer 2s infinite" }}
                />
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">animation: shimmer 2s infinite</p>
            </ComponentShowcase>

            <ComponentShowcase title="fadeInUp">
              <FadeInUpDemo />
            </ComponentShowcase>

            <ComponentShowcase title="bounce">
              <BounceDemo />
            </ComponentShowcase>

            <ComponentShowcase title="slideIn">
              <SlideInDemo />
            </ComponentShowcase>

            <ComponentShowcase title="logoPulse">
              <div className="flex items-center justify-center py-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 font-bold text-white"
                  style={{ animation: "logoPulse 2s ease-in-out infinite" }}
                >
                  A
                </div>
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">animation: logoPulse 2s ease-in-out infinite</p>
            </ComponentShowcase>

            <ComponentShowcase title="gradient-x">
              <div
                className="h-12 rounded-lg"
                style={{
                  background: "linear-gradient(90deg, #1a0533, #ff1493, #c2185b, #1a0533)",
                  backgroundSize: "200% 100%",
                  animation: "gradient-x 3s ease infinite",
                }}
              />
              <p className="mt-2 font-mono text-xs text-muted-foreground">animation: gradient-x 3s ease infinite</p>
            </ComponentShowcase>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Animation</th>
                    <th className="px-4 py-2 text-left font-medium">Keyframes</th>
                    <th className="px-4 py-2 text-left font-medium">Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">shimmer</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">translateX(-100% → 100%)</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">Loading skeleton placeholders</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">gradient-x</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">background-position 0% → 100% → 0%</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">Animated gradient backgrounds</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">fadeInUp</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">opacity 0→1, translateY(6px→0)</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">Content entry animations</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">bounce</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">translateY(0→-4px→0)</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">Typing dots, attention indicators</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">slideIn</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">translateX(-100%→0)</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">Mobile sidebar entrance</td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">logoPulse</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">scale(1→1.08→1), opacity(0.8→1→0.8)</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">Logo / loading indicator</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ---------- Animation demo components ----------

function FadeInUpDemo() {
  const [key, setKey] = useState(0);
  return (
    <div>
      <div key={key} className="py-4">
        <div
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          style={{ animation: "fadeInUp 500ms ease-out" }}
        >
          I fade in and up!
        </div>
      </div>
      <button
        onClick={() => setKey((k) => k + 1)}
        className="text-xs text-muted-foreground underline"
      >
        Replay animation
      </button>
      <p className="mt-1 font-mono text-xs text-muted-foreground">animation: fadeInUp 500ms ease-out</p>
    </div>
  );
}

function BounceDemo() {
  return (
    <div>
      <div className="flex items-center gap-1 py-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-foreground"
            style={{
              animation: "bounce 1.2s infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground">animation: bounce 1.2s infinite (staggered 0.15s)</p>
    </div>
  );
}

function SlideInDemo() {
  const [key, setKey] = useState(0);
  return (
    <div>
      <div key={key} className="overflow-hidden py-4">
        <div
          className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground"
          style={{ animation: "slideIn 300ms ease-out" }}
        >
          I slide in from left!
        </div>
      </div>
      <button
        onClick={() => setKey((k) => k + 1)}
        className="text-xs text-muted-foreground underline"
      >
        Replay animation
      </button>
      <p className="mt-1 font-mono text-xs text-muted-foreground">animation: slideIn 300ms ease-out</p>
    </div>
  );
}
