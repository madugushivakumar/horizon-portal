"use client";

/**
 * Horizon Portal — Login Page
 * src/app/login/page.tsx
 *
 * Built with Horizon Design System (Card, Button, Input, Badge).
 * Supports light & dark modes, full accessibility, keyboard focus,
 * and one-click demo user credentials for assessment evaluation.
 */

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { useTheme } from "@/components/ThemeProvider";

const DEMO_PRESETS = [
  { role: "Admin", email: "admin@growmar.com", pass: "Admin@Horizon2026!", badge: "danger" as const },
  { role: "HR", email: "hr@growmar.com", pass: "HR@Horizon2026!", badge: "warning" as const },
  { role: "Manager", email: "manager@growmar.com", pass: "Manager@Horizon2026!", badge: "primary" as const },
  { role: "Employee", email: "employee@growmar.com", pass: "Employee@Horizon2026!", badge: "secondary" as const },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const fillPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMessage(null);
    setValidationErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Invalid credentials. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful login -> redirect to destination
      router.push(from);
      router.refresh();
    } catch {
      setErrorMessage("Network error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Top right theme toggle & back link */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <Link href="/design" className="text-xs text-[var(--hz-text-muted)] hover:text-[var(--hz-text-primary)] transition-colors">
          Design System
        </Link>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hz-border-default)] bg-[var(--hz-bg-surface)] text-[var(--hz-text-secondary)] hover:bg-[var(--hz-bg-subtle)] transition-colors"
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[var(--hz-primary-600)] to-[var(--hz-secondary-500)] text-white shadow-lg shadow-[var(--hz-primary-500)]/20 mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
            Horizon Portal
          </h1>
          <p className="mt-1 text-xs text-[var(--hz-text-muted)] uppercase tracking-wider font-semibold">
            Aura Workforce by Growmar
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-[var(--hz-border-default)] shadow-[var(--hz-shadow-xl)] backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your corporate credentials to access your workforce dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Global Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--hz-semantic-error-border)] bg-[var(--hz-semantic-error-bg)] p-3 text-xs text-[var(--hz-semantic-error-text)] animate-in fade-in"
              >
                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="name@growmar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                errorText={validationErrors.email}
                disabled={isLoading}
                required
                autoComplete="email"
                leftElement={
                  <svg className="h-4 w-4 text-[var(--hz-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                errorText={validationErrors.password}
                disabled={isLoading}
                required
                autoComplete="current-password"
                leftElement={
                  <svg className="h-4 w-4 text-[var(--hz-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full mt-2 font-medium"
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Fill Section */}
            <div className="mt-6 pt-5 border-t border-[var(--hz-border-default)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hz-text-muted)]">
                  Demo Test Users (Day 3)
                </span>
                <span className="text-[11px] text-[var(--hz-text-muted)]">Click to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PRESETS.map((p) => (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => fillPreset(p.email, p.pass)}
                    className="flex items-center justify-between rounded-lg border border-[var(--hz-border-default)] bg-[var(--hz-bg-subtle)] px-2.5 py-1.5 text-left text-xs hover:border-[var(--hz-primary-500)] hover:bg-[var(--hz-bg-surface)] transition-all"
                  >
                    <span className="font-medium text-[var(--hz-text-primary)]">{p.role}</span>
                    <Badge variant={p.badge} size="sm">
                      {p.role}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-[var(--hz-border-default)] pt-4 text-xs text-[var(--hz-text-muted)]">
            Protected by Horizon Security · Signed HTTP-Only Sessions
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
