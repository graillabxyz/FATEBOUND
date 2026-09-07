import { useState } from "react";
import { rulesLabel } from "../content/terminology";
import type { ReactNode } from "react";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="dev-field">
      <span>{rulesLabel(label)}</span>
      {children}
    </label>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 1000,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={rulesLabel(label)}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="dev-toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{rulesLabel(label)}</span>
    </label>
  );
}
export function Section({
  title,
  children,
  open = false,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="dev-section" open={open || undefined}>
      <summary>{rulesLabel(title)}</summary>
      <div className="dev-section-body">{children}</div>
    </details>
  );
}
export function Json({ value }: { value: unknown }) {
  const [raw, setRaw] = useState(false);
  const present = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(present)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v).map(([k, x]) => [
              (
                {
                  hp: "life",
                  guard: "ward",
                  control: "focus",
                  dice: "omens",
                  cards: "hand",
                  symbol: "sigil",
                  blankShare: "voidShare",
                } as Record<string, string>
              )[k] ?? rulesLabel(k),
              present(x),
            ]),
          )
        : typeof v === "string" && /^[A-Z_]+$/.test(v)
          ? rulesLabel(v)
          : v;
  return (
    <div>
      <button className="dev-muted" onClick={() => setRaw(!raw)}>
        {raw ? "Show game terms" : "Show stored field IDs"}
      </button>
      <pre className="dev-json">
        {JSON.stringify(raw ? value : present(value), null, 2)}
      </pre>
    </div>
  );
}
export function Button({
  children,
  onClick,
  disabled = false,
  primary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      className={`dev-button ${primary ? "primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
