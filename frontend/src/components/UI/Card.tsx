// src/components/ui/Card.tsx
import type { LucideIcon } from "lucide-react"

interface CardProps {
  label:     string
  value:     string | number
  subtext?:  string
  icon?:     LucideIcon
  acento?:   boolean   // ← resalta la card principal
}

export function Card({ label, value, subtext, icon: Icon, acento = false }: CardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: acento ? "var(--color-primary_y)" : "var(--bg-surface)",
        border:     acento ? "none" : "1px solid var(--border-base)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: acento ? "rgba(255,255,255,0.8)" : "var(--text-secondary)" }}
        >
          {label}
        </span>
        {Icon && (
          <Icon
            size={16}
            style={{ color: acento ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}
          />
        )}
      </div>
      <span
        className="text-2xl font-semibold"
        style={{ color: acento ? "white" : "var(--text-primary)" }}
      >
        {value}
      </span>
      {subtext && (
        <span
          className="text-xs"
          style={{ color: acento ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}
        >
          {subtext}
        </span>
      )}
    </div>
  )
}