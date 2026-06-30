import type { ReactNode } from "react";

export type CompanyCardTone = "indigo" | "amber" | "emerald" | "slate" | "red";

export const COMPANY_CARD_TOKENS: Record<
  CompanyCardTone,
  {
    bar: string;
    barGrad: string;
    ring: string;
    glow: string;
    bannerBg: string;
    bannerBorder: string;
    text: string;
    soft: string;
  }
> = {
  indigo: {
    bar: "#667eea",
    barGrad: "linear-gradient(180deg,#7c8ef7,#667eea)",
    ring: "rgba(102,126,234,0.45)",
    glow: "rgba(102,126,234,0.18)",
    bannerBg: "#eef2ff",
    bannerBorder: "rgba(102,126,234,0.22)",
    text: "#4f46e5",
    soft: "#eef2ff",
  },
  amber: {
    bar: "#f59e0b",
    barGrad: "linear-gradient(180deg,#fbbf24,#f59e0b)",
    ring: "rgba(245,158,11,0.5)",
    glow: "rgba(245,158,11,0.2)",
    bannerBg: "#fffbeb",
    bannerBorder: "rgba(245,158,11,0.28)",
    text: "#b45309",
    soft: "#fffbeb",
  },
  emerald: {
    bar: "#10b981",
    barGrad: "linear-gradient(180deg,#34d399,#10b981)",
    ring: "rgba(16,185,129,0.4)",
    glow: "rgba(16,185,129,0.16)",
    bannerBg: "#ecfdf5",
    bannerBorder: "rgba(16,185,129,0.25)",
    text: "#047857",
    soft: "#ecfdf5",
  },
  slate: {
    bar: "#94a3b8",
    barGrad: "linear-gradient(180deg,#cbd5e1,#94a3b8)",
    ring: "rgba(148,163,184,0.3)",
    glow: "rgba(148,163,184,0.12)",
    bannerBg: "#f8fafc",
    bannerBorder: "#e5e7eb",
    text: "#64748b",
    soft: "#f1f5f9",
  },
  red: {
    bar: "#ef4444",
    barGrad: "linear-gradient(180deg,#f87171,#ef4444)",
    ring: "rgba(239,68,68,0.35)",
    glow: "rgba(239,68,68,0.12)",
    bannerBg: "#fef2f2",
    bannerBorder: "rgba(239,68,68,0.18)",
    text: "#b91c1c",
    soft: "#fef2f2",
  },
};

export function CompanyStatePill({
  tone,
  children,
  icon,
  solid = false,
}: {
  tone: CompanyCardTone;
  children: ReactNode;
  icon?: ReactNode;
  solid?: boolean;
}) {
  const token = COMPANY_CARD_TOKENS[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 9999,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        background: solid ? token.bar : token.soft,
        color: solid ? "#fff" : token.text,
        border: solid ? "none" : `1px solid ${token.bannerBorder}`,
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </span>
  );
}

export function CompanyMetricTile({
  label,
  value,
  sub,
  tone,
  emphasize = false,
  noWrapValue = false,
  className,
  valueFontSize,
  valueLineHeight,
  allowBreakValue = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: CompanyCardTone;
  emphasize?: boolean;
  noWrapValue?: boolean;
  className?: string;
  valueFontSize?: string;
  valueLineHeight?: string | number;
  allowBreakValue?: boolean;
}) {
  const token = tone ? COMPANY_CARD_TOKENS[tone] : null;

  return (
    <div
      className={className}
      style={{
        flex: 1,
        minWidth: 0,
        padding: "12px 14px",
        borderRadius: 16,
        background: emphasize && token ? token.soft : "rgba(248,250,252,0.6)",
        border: `1px solid ${emphasize && token ? token.bannerBorder : "#eef0f4"}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        className="font-['var(--font-space-grotesk)'] text-[22px] font-extrabold leading-none tracking-[-0.03em]"
        style={{
          color: emphasize && token ? token.text : "#0f2460",
          whiteSpace: noWrapValue ? "nowrap" : "normal",
          overflowWrap: allowBreakValue ? "anywhere" : "normal",
          hyphens: allowBreakValue ? "auto" : "manual",
          fontSize: valueFontSize ?? "clamp(18px, 1.6vw, 22px)",
          lineHeight: valueLineHeight ?? undefined,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: emphasize && token ? token.text : "#94a3b8",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}
