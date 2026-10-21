import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20 text-center hz-animate-fade-in">
      {/* Logo / Brand Mark */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl hz-gradient-primary flex items-center justify-center shadow-[var(--hz-shadow-md)]"
          aria-hidden="true"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 14C5 9.029 9.029 5 14 5s9 4.029 9 9-4.029 9-9 9-9-4.029-9-9Z"
              fill="white"
              fillOpacity="0.25"
            />
            <path
              d="M10 14h8M14 10v8"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--hz-text-muted)]">
            Growmar · Aura Workforce
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--hz-text-primary)]">
            Horizon Portal
          </h1>
        </div>
      </div>

      {/* Headline */}
      <div className="max-w-lg">
        <h2 className="text-4xl font-extrabold tracking-tight leading-tight text-[var(--hz-text-primary)] mb-4">
          Welcome to the{" "}
          <span className="bg-gradient-to-r from-[var(--hz-primary-500)] to-[var(--hz-secondary-500)] bg-clip-text text-transparent">
            Horizon Design System
          </span>
        </h2>
        <p className="text-lg text-[var(--hz-text-secondary)]">
          A centralized, token-driven design foundation for the Aura Workforce
          platform. Explore all components and theme modes.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/design"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl font-semibold text-sm
            bg-[var(--hz-btn-primary-bg)] text-[var(--hz-btn-primary-text)]
            hover:bg-[var(--hz-btn-primary-bg-hover)] active:bg-[var(--hz-btn-primary-bg-active)]
            shadow-[var(--hz-shadow-sm)] hover:shadow-[var(--hz-shadow-md)]
            transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-[var(--hz-primary-500)]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          View Design System
        </Link>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[var(--hz-border)] bg-[var(--hz-primary-100)] text-[var(--hz-primary-700)]">
          Next.js 16
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[var(--hz-border)] bg-[var(--hz-info-bg)] text-[var(--hz-info-light)]">
          TypeScript 5
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[var(--hz-border)] bg-[var(--hz-secondary-100)] text-[var(--hz-secondary-700)]">
          Tailwind v4
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[var(--hz-border)] bg-[var(--hz-warning-bg)] text-[var(--hz-warning-light)]">
          App Router
        </span>
      </div>
    </main>
  );
}
