"use client";

/**
 * Horizon Design System Showcase — /design
 * src/app/design/page.tsx
 *
 * Displays all four reusable components across both themes.
 * Acts as living documentation and visual regression reference.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";

/* ─── Inner section wrapper ──────────────────────────────── */

const Section: React.FC<{
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ id, title, description, children }) => (
  <section
    id={id}
    aria-labelledby={`${id}-heading`}
    className="hz-animate-fade-in"
  >
    <div className="mb-6">
      <h2
        id={`${id}-heading`}
        className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)] mb-1"
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm text-[var(--hz-text-secondary)]">{description}</p>
      )}
    </div>
    {children}
  </section>
);

/* ─── Demo surface ───────────────────────────────────────── */

const DemoRow: React.FC<{
  label?: string;
  children: React.ReactNode;
  vertical?: boolean;
}> = ({ label, children, vertical }) => (
  <div className="flex flex-col gap-3">
    {label && (
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--hz-text-muted)]">
        {label}
      </p>
    )}
    <div
      className={[
        "flex flex-wrap",
        vertical ? "flex-col items-start" : "items-center",
        "gap-3",
      ].join(" ")}
    >
      {children}
    </div>
  </div>
);

const Divider: React.FC = () => (
  <hr className="border-[var(--hz-border)] my-2" />
);

/* ─── Theme Toggle ───────────────────────────────────────── */

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      id="hz-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={[
        "relative inline-flex h-9 w-[4.5rem] items-center rounded-full",
        "border-2 transition-all duration-300 cursor-pointer",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--hz-focus-ring)]",
        isDark
          ? "bg-[var(--hz-primary-600)] border-[var(--hz-primary-500)]"
          : "bg-[var(--hz-neutral-200)] border-[var(--hz-neutral-300)]",
      ].join(" ")}
    >
      {/* Knob */}
      <span
        className={[
          "absolute inline-flex h-6 w-6 items-center justify-center",
          "rounded-full shadow-[var(--hz-shadow-sm)]",
          "transition-transform duration-300",
          isDark
            ? "translate-x-9 bg-[var(--hz-neutral-0)]"
            : "translate-x-0.5 bg-[var(--hz-neutral-0)]",
        ].join(" ")}
        aria-hidden="true"
      >
        {isDark ? (
          /* Moon */
          <svg
            className="w-3.5 h-3.5 text-[var(--hz-primary-600)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21.75 15.005A9.75 9.75 0 019.245 2.5a.75.75 0 00-.99-.97 10.5 10.5 0 1013.215 13.215.75.75 0 00-.72-.74z" />
          </svg>
        ) : (
          /* Sun */
          <svg
            className="w-3.5 h-3.5 text-[var(--hz-warning-light)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zm0 15a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm7.072-9.218a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zm-12.9-1.06a.75.75 0 10-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06zM2.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm17.25 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H20.25a.75.75 0 01-.75-.75zm-2.22 6.218a.75.75 0 101.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06zM7.19 17.218a.75.75 0 001.06-1.06L7.19 15.097a.75.75 0 00-1.06 1.06l1.06 1.06zm4.81 1.532a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V19.5a.75.75 0 01.75-.75z" />
          </svg>
        )}
      </span>

      {/* Labels */}
      <span
        className={[
          "absolute right-2 text-[0.6rem] font-bold transition-opacity",
          isDark
            ? "opacity-100 text-[var(--hz-primary-200)]"
            : "opacity-0",
        ].join(" ")}
        aria-hidden="true"
      >
        Dark
      </span>
      <span
        className={[
          "absolute left-2 text-[0.6rem] font-bold transition-opacity",
          !isDark
            ? "opacity-100 text-[var(--hz-neutral-600)]"
            : "opacity-0",
        ].join(" ")}
        aria-hidden="true"
      >
        Light
      </span>
    </button>
  );
};

/* ─── Main Page ──────────────────────────────────────────── */

export default function DesignPage() {
  const { theme } = useTheme();

  /* Button demo state */
  const [isLoading, setIsLoading] = useState(false);
  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2500);
  };

  /* Input demo state */
  const [inputVal, setInputVal] = useState("");
  const [touched, setTouched] = useState(false);
  const inputError =
    touched && inputVal.length < 3
      ? "Username must be at least 3 characters."
      : undefined;

  /* Badge variants */
  const badgeVariants: { variant: BadgeVariant; label: string }[] = [
    { variant: "default",   label: "Default" },
    { variant: "primary",   label: "Primary" },
    { variant: "secondary", label: "Secondary" },
    { variant: "success",   label: "Success" },
    { variant: "warning",   label: "Warning" },
    { variant: "danger",    label: "Danger" },
    { variant: "info",      label: "Info" },
  ];

  return (
    <div className="min-h-dvh bg-[var(--hz-bg-base)] transition-colors duration-300">
      {/* ── Page Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 hz-glass border-b border-[var(--hz-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div
              className="w-9 h-9 rounded-lg hz-gradient-primary flex items-center justify-center shadow-[var(--hz-shadow-sm)] shrink-0"
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M10 4v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--hz-text-muted)]">
                Growmar · Aura Workforce
              </p>
              <h1 className="text-base font-bold leading-tight text-[var(--hz-text-primary)]">
                Horizon Design System
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme indicator */}
            <span className="hidden sm:block text-xs text-[var(--hz-text-muted)] font-medium">
              {theme === "dark" ? "Dark" : "Light"} mode
            </span>

            <ThemeToggle />

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium
                text-[var(--hz-text-secondary)] hover:text-[var(--hz-text-primary)]
                transition-colors duration-150
                focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-[var(--hz-focus-ring)] rounded"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Strip ──────────────────────────────────────── */}
      <div className="hz-gradient-hero text-[var(--hz-neutral-50)] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--hz-primary-300)] mb-2">
                Phase 1 · Day 1 · Horizon Portal
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
                Component Showcase
              </h2>
              <p className="text-base text-[var(--hz-primary-200)] max-w-xl">
                Every component below is built with the Horizon token system — no
                hard-coded colours. Toggle the theme to see both modes.
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-3">
              {[
                ["4", "Components"],
                ["7", "Badge variants"],
                ["3", "Button variants"],
                ["2", "Themes"],
              ].map(([num, lbl]) => (
                <div
                  key={lbl}
                  className="flex flex-col items-center px-5 py-3 rounded-xl
                    bg-[var(--hz-primary-800)] bg-opacity-50 border border-[var(--hz-primary-700)]"
                >
                  <span className="text-2xl font-extrabold text-[var(--hz-neutral-0)]">{num}</span>
                  <span className="text-xs text-[var(--hz-primary-300)]">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <main
        id="design-main"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16"
      >
        {/* ── SECTION: Color Tokens ─────────────────────────── */}
        <Section
          id="colors"
          title="Color Tokens"
          description="Horizon brand palette from design_tokens.json — rendered via CSS custom properties."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Primary Palette */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Primary</CardTitle>
                <Badge variant="primary" size="sm">Indigo</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 border border-[var(--hz-border)]"
                        style={{ backgroundColor: `var(--hz-primary-${shade})` }}
                        aria-label={`Primary ${shade}`}
                      />
                      <span className="text-xs font-mono text-[var(--hz-text-secondary)]">
                        primary-{shade}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Secondary Palette */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Secondary</CardTitle>
                <Badge variant="secondary" size="sm">Emerald</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 border border-[var(--hz-border)]"
                        style={{ backgroundColor: `var(--hz-secondary-${shade})` }}
                        aria-label={`Secondary ${shade}`}
                      />
                      <span className="text-xs font-mono text-[var(--hz-text-secondary)]">
                        secondary-{shade}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Semantic Colours */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Semantic</CardTitle>
                <Badge variant="info" size="sm">Status</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "Success", var: "--hz-success", badge: "success" as BadgeVariant },
                    { name: "Warning", var: "--hz-warning", badge: "warning" as BadgeVariant },
                    { name: "Danger",  var: "--hz-danger",  badge: "danger"  as BadgeVariant },
                    { name: "Info",    var: "--hz-info",    badge: "info"    as BadgeVariant },
                  ].map(({ name, var: cssVar, badge }) => (
                    <div key={name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg shrink-0"
                          style={{ backgroundColor: `var(${cssVar})` }}
                          aria-label={name}
                        />
                        <span className="text-xs font-mono text-[var(--hz-text-secondary)]">
                          {cssVar}
                        </span>
                      </div>
                      <Badge variant={badge} size="sm">{name}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Neutral Scale */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Neutral</CardTitle>
                <Badge variant="default" size="sm">Slate</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {[0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                    <div key={shade} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg shrink-0 border border-[var(--hz-border)]"
                        style={{ backgroundColor: `var(--hz-neutral-${shade})` }}
                        aria-label={`Neutral ${shade}`}
                      />
                      <span className="text-xs font-mono text-[var(--hz-text-secondary)]">
                        neutral-{shade}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Divider />

        {/* ── SECTION: Button ───────────────────────────────── */}
        <Section
          id="buttons"
          title="Button"
          description="Three variants × three sizes, with loading and disabled states. All interaction colours come from Horizon tokens."
        >
          <div className="space-y-8">
            {/* Variants × sizes */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Variants & Sizes</CardTitle>
                <Badge variant="primary" size="sm">3 variants · 3 sizes</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {(["primary", "secondary", "danger"] as const).map((v) => (
                  <DemoRow key={v} label={v.charAt(0).toUpperCase() + v.slice(1)}>
                    <Button id={`btn-${v}-sm`}  variant={v} size="sm">Small</Button>
                    <Button id={`btn-${v}-md`}  variant={v} size="md">Medium</Button>
                    <Button id={`btn-${v}-lg`}  variant={v} size="lg">Large</Button>
                  </DemoRow>
                ))}
              </CardContent>
            </Card>

            {/* States */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">States</CardTitle>
                <Badge variant="info" size="sm">Normal · Disabled · Loading</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <DemoRow label="Normal">
                  <Button id="btn-normal-primary"   variant="primary">Primary</Button>
                  <Button id="btn-normal-secondary" variant="secondary">Secondary</Button>
                  <Button id="btn-normal-danger"    variant="danger">Danger</Button>
                </DemoRow>

                <DemoRow label="Disabled">
                  <Button id="btn-disabled-primary"   variant="primary"   disabled>Primary</Button>
                  <Button id="btn-disabled-secondary" variant="secondary" disabled>Secondary</Button>
                  <Button id="btn-disabled-danger"    variant="danger"    disabled>Danger</Button>
                </DemoRow>

                <DemoRow label="Loading (click to trigger)">
                  <Button
                    id="btn-loading-trigger"
                    variant="primary"
                    loading={isLoading}
                    onClick={handleLoadingDemo}
                  >
                    {isLoading ? "Processing…" : "Start Loading"}
                  </Button>
                  <Button id="btn-loading-secondary" variant="secondary" loading>
                    Loading
                  </Button>
                  <Button id="btn-loading-danger" variant="danger" loading>
                    Deleting
                  </Button>
                </DemoRow>

                <DemoRow label="With Icons">
                  <Button
                    id="btn-icon-left"
                    variant="primary"
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    }
                  >
                    Download
                  </Button>
                  <Button
                    id="btn-icon-right"
                    variant="secondary"
                    rightIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    }
                  >
                    Continue
                  </Button>
                </DemoRow>

                <DemoRow label="Full-width">
                  <div className="w-full max-w-sm">
                    <Button id="btn-fullwidth" variant="primary" fullWidth>
                      Full-width Button
                    </Button>
                  </div>
                </DemoRow>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Divider />

        {/* ── SECTION: Input ────────────────────────────────── */}
        <Section
          id="inputs"
          title="Input"
          description="Labeled, accessible inputs with error messaging, helper text, and multiple states."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Normal */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Normal</CardTitle>
                <Badge variant="success" dot size="sm">Active</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="input-normal-name"
                  label="Full Name"
                  placeholder="Jane Doe"
                  helperText="Enter your legal name as it appears on official documents."
                />
                <Input
                  id="input-normal-email"
                  label="Email Address"
                  type="email"
                  placeholder="jane@growmar.io"
                  required
                />
              </CardContent>
            </Card>

            {/* With Error */}
            <Card elevation="raised" padding="md" accent="danger">
              <CardHeader>
                <CardTitle as="h3">Error State</CardTitle>
                <Badge variant="danger" dot size="sm">Invalid</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="input-error-username"
                  label="Username"
                  placeholder="your-handle"
                  required
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onBlur={() => setTouched(true)}
                  errorText={inputError}
                  helperText={!inputError ? "Choose a unique username." : undefined}
                />
                <Input
                  id="input-error-static"
                  label="Employee ID"
                  placeholder="EMP-0001"
                  errorText="This Employee ID is already in use."
                  defaultValue="EMP-0001"
                  required
                />
              </CardContent>
            </Card>

            {/* Disabled */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Disabled</CardTitle>
                <Badge variant="default" size="sm">Read-only</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="input-disabled-dept"
                  label="Department"
                  placeholder="Engineering"
                  disabled
                  defaultValue="Engineering"
                />
                <Input
                  id="input-disabled-role"
                  label="Role"
                  placeholder="Software Engineer"
                  disabled
                  defaultValue="Software Engineer"
                  helperText="Role is set by your administrator."
                />
              </CardContent>
            </Card>

            {/* With Icons */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">With Element Slots</CardTitle>
                <Badge variant="info" size="sm">Icons</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  id="input-search"
                  label="Search Employees"
                  placeholder="Name, email, department…"
                  leftElement={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  }
                />
                <Input
                  id="input-password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required
                  leftElement={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </Section>

        <Divider />

        {/* ── SECTION: Card ─────────────────────────────────── */}
        <Section
          id="cards"
          title="Card"
          description="Composable surface component with elevation, accent, and interactive presets."
        >
          <div className="space-y-6">
            {/* Elevation variants */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(["flat", "raised", "elevated"] as const).map((el) => (
                <Card key={el} id={`card-${el}`} elevation={el} padding="md">
                  <CardHeader>
                    <CardTitle as="h3" className="capitalize">{el}</CardTitle>
                    <Badge variant="default" size="sm">elevation</Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      This card uses the <code className="font-mono text-xs bg-[var(--hz-bg-subtle)] px-1 py-0.5 rounded">{el}</code> elevation preset.
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Accent variants */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              {(["primary", "secondary", "success", "warning", "danger", "info"] as const).map((accent) => (
                <Card key={accent} id={`card-accent-${accent}`} accent={accent} elevation="raised" padding="md">
                  <CardTitle as="h4" className="capitalize text-base mb-1">{accent}</CardTitle>
                  <CardDescription className="text-xs">Accent bar</CardDescription>
                </Card>
              ))}
            </div>

            {/* Interactive card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card
                id="card-interactive"
                elevation="raised"
                interactive
                accent="primary"
                padding="md"
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label="Interactive card example — click for action"
              >
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg hz-gradient-primary flex items-center justify-center" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <Badge variant="primary" size="sm">Interactive</Badge>
                </CardHeader>
                <CardContent>
                  <CardTitle as="h3" className="mb-1">Jane Doe</CardTitle>
                  <CardDescription>Senior Engineer · Platform Team</CardDescription>
                </CardContent>
                <CardFooter>
                  <Badge variant="success" dot>Active</Badge>
                  <Badge variant="info" size="sm">L5</Badge>
                </CardFooter>
              </Card>

              {/* Info card */}
              <Card id="card-info" elevation="raised" padding="md">
                <CardHeader>
                  <CardTitle as="h3">Metric Card</CardTitle>
                  <Badge variant="success" size="sm">↑ 12%</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-extrabold tracking-tight text-[var(--hz-primary-600)]">
                    1,284
                  </p>
                  <CardDescription className="mt-1">Total active employees</CardDescription>
                </CardContent>
                <CardFooter>
                  <CardDescription className="text-xs">Updated just now</CardDescription>
                </CardFooter>
              </Card>

              {/* Notification card */}
              <Card id="card-notification" elevation="raised" padding="md" accent="warning">
                <CardHeader>
                  <CardTitle as="h3">System Notice</CardTitle>
                  <Badge variant="warning" dot>Pending</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    A scheduled maintenance window is planned for Sunday 02:00–04:00 UTC.
                    Data exports may be temporarily unavailable.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button id="card-btn-dismiss" variant="secondary" size="sm">Dismiss</Button>
                  <Button id="card-btn-view" variant="primary" size="sm">View Details</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── SECTION: Badge ────────────────────────────────── */}
        <Section
          id="badges"
          title="Badge"
          description="Compact status and category labels in 7 semantic variants."
        >
          <div className="space-y-6">
            {/* All variants */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">All Variants</CardTitle>
                <Badge variant="primary" size="sm">7 variants</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <DemoRow label="Medium (default size)">
                  {badgeVariants.map(({ variant, label }) => (
                    <Badge key={variant} id={`badge-${variant}`} variant={variant}>
                      {label}
                    </Badge>
                  ))}
                </DemoRow>

                <DemoRow label="Small">
                  {badgeVariants.map(({ variant, label }) => (
                    <Badge key={variant} id={`badge-sm-${variant}`} variant={variant} size="sm">
                      {label}
                    </Badge>
                  ))}
                </DemoRow>

                <DemoRow label="With Status Dot">
                  {badgeVariants.map(({ variant, label }) => (
                    <Badge key={variant} id={`badge-dot-${variant}`} variant={variant} dot>
                      {label}
                    </Badge>
                  ))}
                </DemoRow>

                <DemoRow label="Square pill (pill=false)">
                  {badgeVariants.map(({ variant, label }) => (
                    <Badge key={variant} id={`badge-sq-${variant}`} variant={variant} pill={false}>
                      {label}
                    </Badge>
                  ))}
                </DemoRow>
              </CardContent>
            </Card>

            {/* Real-world examples */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Real-world Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--hz-text-secondary)]">Employment Status:</span>
                    <Badge variant="success" dot>Full-time</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--hz-text-secondary)]">Clearance:</span>
                    <Badge variant="primary">Level 3</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--hz-text-secondary)]">Leave:</span>
                    <Badge variant="warning" dot>Pending</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--hz-text-secondary)]">Contract:</span>
                    <Badge variant="danger" dot>Expired</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--hz-text-secondary)]">Role:</span>
                    <Badge variant="secondary">Senior Engineer</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--hz-text-secondary)]">Review:</span>
                    <Badge variant="info">Q4 2025</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Divider />

        {/* ── SECTION: Typography ───────────────────────────── */}
        <Section
          id="typography"
          title="Typography"
          description="Horizon type scale using Inter — from xs to 4xl."
        >
          <Card elevation="raised" padding="lg">
            <div className="space-y-4">
              {[
                { label: "4XL · 2.25rem · 800", cls: "text-4xl font-extrabold", text: "The quick brown fox" },
                { label: "3XL · 1.875rem · 700", cls: "text-3xl font-bold", text: "The quick brown fox" },
                { label: "2XL · 1.5rem · 700", cls: "text-2xl font-bold", text: "The quick brown fox" },
                { label: "XL · 1.25rem · 600", cls: "text-xl font-semibold", text: "The quick brown fox jumps over" },
                { label: "LG · 1.125rem · 600", cls: "text-lg font-semibold", text: "The quick brown fox jumps over the lazy dog" },
                { label: "Base · 1rem · 400", cls: "text-base font-normal", text: "The quick brown fox jumps over the lazy dog" },
                { label: "SM · 0.875rem · 400", cls: "text-sm font-normal", text: "The quick brown fox jumps over the lazy dog" },
                { label: "XS · 0.75rem · 500", cls: "text-xs font-medium", text: "The quick brown fox jumps over the lazy dog — uppercase label" },
              ].map(({ label, cls, text }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                  <span className="text-xs font-mono text-[var(--hz-text-muted)] min-w-[14rem] shrink-0">
                    {label}
                  </span>
                  <p className={`${cls} text-[var(--hz-text-primary)] leading-snug`}>{text}</p>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        <Divider />

        {/* ── SECTION: Theme Demo ───────────────────────────── */}
        <Section
          id="theme"
          title="Theme Demonstration"
          description="Both themes use the exact same Horizon semantic token aliases. Toggle the switch to see the live update."
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card elevation="elevated" padding="md">
              <CardHeader>
                <CardTitle as="h3">Semantic Token Summary</CardTitle>
                <Badge
                  variant={theme === "dark" ? "primary" : "secondary"}
                  dot
                >
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "bg-base",        var: "--hz-bg-base" },
                    { name: "bg-surface",     var: "--hz-bg-surface" },
                    { name: "bg-subtle",      var: "--hz-bg-subtle" },
                    { name: "border",         var: "--hz-border" },
                    { name: "text-primary",   var: "--hz-text-primary" },
                    { name: "text-secondary", var: "--hz-text-secondary" },
                    { name: "text-muted",     var: "--hz-text-muted" },
                    { name: "focus-ring",     var: "--hz-focus-ring" },
                  ].map(({ name, var: cssVar }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded border border-[var(--hz-border-strong)] shrink-0"
                        style={{ backgroundColor: `var(${cssVar})` }}
                        aria-hidden="true"
                      />
                      <code className="text-xs font-mono text-[var(--hz-text-secondary)]">
                        {cssVar}
                      </code>
                      <span className="text-xs text-[var(--hz-text-muted)] ml-auto">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card elevation="raised" padding="md">
                <CardHeader>
                  <CardTitle as="h3">Toggle Theme Now</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                  <ThemeToggle />
                  <div>
                    <p className="text-sm font-semibold text-[var(--hz-text-primary)] mb-1">
                      Current: {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
                    </p>
                    <p className="text-xs text-[var(--hz-text-secondary)]">
                      Saved to localStorage · No page reload required
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card elevation="raised" padding="md" accent="info">
                <CardHeader>
                  <CardTitle as="h3">Contrast Notes</CardTitle>
                  <Badge variant="info" size="sm">Accessibility</Badge>
                </CardHeader>
                <CardContent className="text-sm space-y-3 text-[var(--hz-text-secondary)]">
                  <p>
                    <strong className="text-[var(--hz-text-primary)]">Potential dark-mode contrast issues:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      <code className="font-mono text-xs bg-[var(--hz-bg-subtle)] px-1 rounded">text-muted (#64748b)</code> on{" "}
                      <code className="font-mono text-xs bg-[var(--hz-bg-subtle)] px-1 rounded">bg-surface (#1e293b)</code> —
                      ratio ≈ 3.8:1 (fails AA for normal text, passes for large text). Fix: use{" "}
                      <code className="font-mono text-xs bg-[var(--hz-bg-subtle)] px-1 rounded">neutral-400</code> for dark-mode muted.
                    </li>
                    <li>
                      <code className="font-mono text-xs bg-[var(--hz-bg-subtle)] px-1 rounded">warning-text-dark (#fbbf24)</code> on{" "}
                      <code className="font-mono text-xs bg-[var(--hz-bg-subtle)] px-1 rounded">warning-bg-dark (#1c1501)</code> —
                      ratio ≈ 8.4:1 (passes AA/AAA). Safe.
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ── SECTION: Spacing & Radius ─────────────────────── */}
        <Section
          id="tokens"
          title="Spacing & Radius Tokens"
          description="Visual reference for the Horizon spacing scale and border-radius presets."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Spacing */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Spacing Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "1", size: "0.25rem", cls: "w-1" },
                  { name: "2", size: "0.5rem",  cls: "w-2" },
                  { name: "3", size: "0.75rem", cls: "w-3" },
                  { name: "4", size: "1rem",    cls: "w-4" },
                  { name: "6", size: "1.5rem",  cls: "w-6" },
                  { name: "8", size: "2rem",    cls: "w-8" },
                  { name: "12", size: "3rem",   cls: "w-12" },
                  { name: "16", size: "4rem",   cls: "w-16" },
                ].map(({ name, size, cls }) => (
                  <div key={name} className="flex items-center gap-3">
                    <div
                      className={`${cls} h-4 rounded-sm bg-[var(--hz-primary-400)]`}
                      aria-hidden="true"
                    />
                    <code className="text-xs font-mono text-[var(--hz-text-secondary)]">
                      {name} · {size}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Border Radius */}
            <Card elevation="raised" padding="md">
              <CardHeader>
                <CardTitle as="h3">Border Radius</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "sm",   val: "0.25rem",  cls: "rounded-sm" },
                  { name: "md",   val: "0.375rem", cls: "rounded-md" },
                  { name: "lg",   val: "0.5rem",   cls: "rounded-lg" },
                  { name: "xl",   val: "0.75rem",  cls: "rounded-xl" },
                  { name: "2xl",  val: "1rem",     cls: "rounded-2xl" },
                  { name: "3xl",  val: "1.5rem",   cls: "rounded-3xl" },
                  { name: "full", val: "9999px",   cls: "rounded-full" },
                ].map(({ name, val, cls }) => (
                  <div key={name} className="flex items-center gap-4">
                    <div
                      className={`w-16 h-10 bg-[var(--hz-primary-100)] border-2 border-[var(--hz-primary-400)] ${cls} shrink-0`}
                      aria-hidden="true"
                    />
                    <code className="text-xs font-mono text-[var(--hz-text-secondary)]">
                      {name} · {val}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="pt-8 pb-4 border-t border-[var(--hz-border)] text-center">
          <p className="text-xs text-[var(--hz-text-muted)]">
            Horizon Design System · Aura Workforce by Growmar · Phase 1 · Day 1 · Built with Next.js 16 + Tailwind CSS v4
          </p>
        </footer>
      </main>
    </div>
  );
}
