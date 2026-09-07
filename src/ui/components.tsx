import { useEffect, useRef, useState } from "react";
import { DIE_PROJECTIONS, DIE_SHAPES } from "./dice-geometry";
import type { CSSProperties, ReactNode } from "react";
import {
  Home,
  Layers3,
  Sparkles,
  Users,
  Compass,
  Dices,
  Shield,
  Swords,
  Heart,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Plus,
  Minus,
  Check,
  LockKeyhole,
  Settings,
  BookOpen,
  Bell,
  Trophy,
  Crown,
  Coins,
  Gem,
  Leaf,
  Wind,
  Sun,
  Moon,
  CircleHelp,
  Flame,
  ArrowRight,
  ArrowLeftRight,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
  Star,
  Copy,
  Save,
  Pencil,
  SlidersHorizontal,
  Send,
  LogOut,
  Target,
  Zap,
  Hexagon,
  Eye,
  ScrollText,
  Gift,
  Beaker,
  Flag,
  Hand,
  Search,
  MoreHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CardDef, DieDef, Face, Legend, LegendId } from "../engine/types";
import { legendById } from "../content/legends";
const icons: Record<string, LucideIcon> = {
  home: Home,
  loadout: Layers3,
  legends: Compass,
  pass: Sparkles,
  social: Users,
  dice: Dices,
  guard: Shield,
  attack: Swords,
  heart: Heart,
  right: ChevronRight,
  left: ChevronLeft,
  down: ChevronDown,
  close: X,
  plus: Plus,
  minus: Minus,
  check: Check,
  lock: LockKeyhole,
  settings: Settings,
  book: BookOpen,
  bell: Bell,
  trophy: Trophy,
  crown: Crown,
  coins: Coins,
  gems: Gem,
  leaf: Leaf,
  wind: Wind,
  sun: Sun,
  moon: Moon,
  help: CircleHelp,
  flame: Flame,
  arrow: ArrowRight,
  swap: ArrowLeftRight,
  flip: RotateCcw,
  timer: Timer,
  volume: Volume2,
  mute: VolumeX,
  star: Star,
  copy: Copy,
  save: Save,
  pencil: Pencil,
  filter: SlidersHorizontal,
  send: Send,
  exit: LogOut,
  target: Target,
  control: Zap,
  hex: Hexagon,
  eye: Eye,
  scroll: ScrollText,
  gift: Gift,
  lab: Beaker,
  flag: Flag,
  hand: Hand,
  search: Search,
  more: MoreHorizontal,
};
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Component = icons[name] ?? Sparkles;
  return (
    <Component size={size} strokeWidth={1.6} aria-hidden="true" {...props} />
  );
}
export function Sigil({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m32 5 23 13v28L32 59 9 46V18Z M9 18l23 14 23-14M32 32v27M32 5v27M9 46l23-14 23 14"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="6" fill="currentColor" />
    </svg>
  );
}
export function LegendArt({
  id,
  className = "",
  children,
}: {
  id: LegendId;
  className?: string;
  children?: ReactNode;
}) {
  const l = legendById[id];
  return (
    <div
      className={`legend-art ${className}`}
      style={
        {
          "--art-x": `${(l.artIndex % 3) * 50}%`,
          "--art-y": `${Math.floor(l.artIndex / 3) * 100}%`,
          "--legend-color": l.color,
        } as CSSProperties
      }
      role="img"
      aria-label={`${l.name}, ${l.archetype}`}
    >
      <div className="portrait-paint" />
      {children}
    </div>
  );
}
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
  icon,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  icon?: string;
}) {
  return (
    <button
      className={`primary-button ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
      <Icon name="arrow" size={19} />
    </button>
  );
}
export function SecondaryButton({
  children,
  onClick,
  icon,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      className={`secondary-button ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <Icon name={icon} size={17} />} {children}
    </button>
  );
}
export function IconButton({
  icon,
  label,
  onClick,
  className = "",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`icon-button ${className}`}
      aria-label={label}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}
export function CurrencyCounter({
  coins,
  gems,
}: {
  coins: number;
  gems: number;
}) {
  return (
    <div className="currencies">
      <span>
        <Icon name="coins" size={16} />
        {coins.toLocaleString()}
      </span>
      <span>
        <Icon name="gems" size={15} />
        {gems.toLocaleString()}
      </span>
    </div>
  );
}
export function RankBadge({
  label = "Stone III",
  small = false,
}: {
  label?: string;
  small?: boolean;
}) {
  return (
    <span className={`rank-badge ${small ? "small" : ""}`}>
      <Icon name="hex" size={small ? 14 : 20} />
      {label}
    </span>
  );
}
export function HealthBar({
  hp,
  max,
  guard = 0,
}: {
  hp: number;
  max: number;
  guard?: number;
}) {
  const previous = useRef(hp);
  const [change, setChange] = useState(0);
  useEffect(() => {
    const delta = hp - previous.current;
    previous.current = hp;
    setChange(delta);
    const timer = window.setTimeout(() => setChange(0), 1100);
    return () => window.clearTimeout(timer);
  }, [hp]);
  const bounded = Math.max(0, Math.min(hp, max));
  return (
    <div
      className={`health ${hp <= max * 0.25 ? "health-critical" : ""} ${change < 0 ? "health-hit" : ""}`}
    >
      {change !== 0 && (
        <span
          key={hp}
          className={`health-change ${change > 0 ? "healed" : ""}`}
          aria-hidden="true"
        >
          {change > 0 ? "+" : ""}
          {change}
        </span>
      )}
      <div className="health-label">
        <span>
          <Icon name="heart" size={12} />
          <b>{hp}</b>
          <span>/ {max}</span>
        </span>
        {guard > 0 && (
          <span className="guard-count">
            <Icon name="guard" size={12} />
            {guard}
          </span>
        )}
      </div>
      <div
        className="health-track"
        role="progressbar"
        aria-label="Health"
        aria-valuenow={bounded}
        aria-valuetext={`${hp} of ${max} HP`}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <i style={{ width: `${max > 0 ? (bounded / max) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
export function ControlCounter({ value }: { value: number }) {
  return (
    <div className="control-counter" aria-label={`${value} Control remaining`}>
      <Icon name="control" size={15} />
      <span>CONTROL</span>
      {[0, 1].map((i) => (
        <i className={i < value ? "lit" : ""} key={i} />
      ))}
      <b>{value}</b>
    </div>
  );
}
export function Die({
  definition,
  face,
  selected = false,
  assigned = false,
  small = false,
  skin = "carved",
  onClick,
  label,
  rolling = false,
  children,
}: {
  definition: DieDef;
  face?: Face;
  selected?: boolean;
  assigned?: boolean;
  small?: boolean;
  skin?: string;
  onClick?: () => void;
  label?: string;
  rolling?: boolean;
  children?: ReactNode;
}) {
  const Root = onClick ? "button" : "div";
  const geometry = DIE_PROJECTIONS[definition.size];
  return (
    <Root
      className={`die polyhedral die-d${definition.size} ${small ? "small" : ""} ${selected ? "selected" : ""} ${assigned ? "assigned" : ""} ${rolling ? "rolling" : ""} skin-${skin}`}
      onClick={onClick}
      aria-label={
        label ??
        `${definition.name}, d${definition.size} ${DIE_SHAPES[definition.size]}${face ? `, ${face.type === "symbol" ? face.effectId : face.type === "blank" ? "blank" : face.value}` : ""}`
      }
      aria-pressed={onClick ? selected : undefined}
      role={onClick ? undefined : "img"}
    >
      <svg viewBox="0 0 100 104" className="die-polyhedron" aria-hidden="true">
        {geometry.faces.map((facet, i) => (
          <polygon
            key={i}
            points={facet.points}
            className={facet.front ? "die-facet face-front" : "die-facet"}
            style={{ "--facet-light": `${facet.light}%` } as CSSProperties}
          />
        ))}
      </svg>
      <span
        className={`die-face ${face?.type === "symbol" ? "symbol-face" : ""}`}
        style={{
          left: `${geometry.label[0]}%`,
          top: `${geometry.label[1] / 1.04}%`,
        }}
      >
        {face ? (
          face.type === "symbol" ? (
            <Icon
              name={
                face.effectId === "strike"
                  ? "attack"
                  : face.effectId === "guard"
                    ? "guard"
                    : face.effectId === "swap"
                      ? "swap"
                      : face.effectId === "steal"
                        ? "arrow"
                        : "flip"
              }
              size={small ? 17 : 25}
            />
          ) : (
            face.displayIcon
          )
        ) : (
          definition.size
        )}
      </span>
      <span className="die-size">D{definition.size}</span>
      {assigned && (
        <span className="assigned-mark">
          <Icon name="check" size={11} />
        </span>
      )}
      {children}
    </Root>
  );
}
export const CARD_ICONS: Record<CardDef["category"], string> = {
  Attack: "attack",
  Guard: "guard",
  Counter: "wind",
  Recovery: "heart",
  Manipulation: "swap",
  Setup: "sun",
  Finisher: "flame",
  Prediction: "eye",
};
export function GameplayCard({
  card,
  onClick,
  selected = false,
  compact = false,
  assigned = [],
  disabled = false,
  onInspect,
}: {
  card: CardDef;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  assigned?: string[];
  disabled?: boolean;
  onInspect?: () => void;
}) {
  const icon = CARD_ICONS[card.category];
  return (
    <div
      className={`gameplay-card ${compact ? "compact" : ""} ${selected ? "selected" : ""} ${disabled ? "unavailable" : ""}`}
      data-card-target={card.id}
      data-category={card.category}
    >
      <button
        className="card-select"
        onClick={onClick}
        aria-label={`${card.name}. ${card.requirementLabel}. ${card.text}`}
        aria-pressed={selected}
      >
        <div className="card-top">
          <span>{card.name}</span>
          <Icon name={icon} size={12} />
        </div>
        <LegendArt id={card.legend} className="card-illustration">
          <span className="card-symbol">
            <Icon name={icon} size={26} />
          </span>
        </LegendArt>
        <div className="card-rules">
          <strong>{card.requirementLabel}</strong>
          <p>{card.text}</p>
        </div>
        {assigned.length > 0 && (
          <span className="assigned-dice">
            {assigned.join(" + ")} <Icon name="check" size={10} />
          </span>
        )}
      </button>
      {onInspect && (
        <button
          className="card-inspect"
          onClick={onInspect}
          aria-label={`Inspect ${card.name}`}
        >
          <Icon name="search" size={13} />
        </button>
      )}
    </div>
  );
}
export function CardBack({
  index,
  onClick,
  known,
}: {
  index: number;
  onClick?: () => void;
  known?: CardDef;
}) {
  return (
    <button
      className={`card-back ${known ? "known" : ""}`}
      onClick={onClick}
      aria-label={
        known ? `Known: ${known.name}` : `Unknown opponent card ${index + 1}`
      }
    >
      {known ? (
        <>
          <Icon name="eye" size={12} />
          <span>{known.name}</span>
          <small>{known.requirementLabel}</small>
        </>
      ) : (
        <>
          <Sigil size={23} />
          <span>?</span>
        </>
      )}
    </button>
  );
}
export function LegendCard({
  legend,
  selected = false,
  onClick,
}: {
  legend: Legend;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`legend-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <LegendArt id={legend.id} />
      <span className="legend-card-copy">
        <small>{legend.archetype.split(" / ")[0]}</small>
        <strong>{legend.name}</strong>
        <span>{legend.region.split(" · ")[0]}</span>
      </span>
      <span className="legend-hp">
        <Icon name="heart" size={11} />
        {legend.hp}
      </span>
      {selected && (
        <span className="legend-selected">
          <Icon name="check" size={14} />
        </span>
      )}
    </button>
  );
}
export const NAV_ITEMS = [
  ["home", "Home"],
  ["loadout", "Loadout"],
  ["legends", "Legends"],
  ["pass", "Pass"],
  ["social", "Social"],
];
export function BottomNavigation({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <nav className="bottom-navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(([id, label]) => (
        <button
          key={id}
          className={active === id ? "active" : ""}
          onClick={() => onChange(id)}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon name={id} size={22} />
          <span>{label}</span>
          {active === id && <i />}
        </button>
      ))}
    </nav>
  );
}
export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const el = ref.current;
    el?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && el) {
        const list = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input,select,a[href],[tabindex="0"]',
          ),
        );
        const first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header>
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </header>
        {children}
      </div>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
export function SectionLabel({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="section-label">
      <span>{children}</span>
      {right}
    </div>
  );
}
export function RewardTile({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <div className="reward-tile">
      <Icon name={icon} size={22} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
export function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-orbit">
        <Icon name={icon} size={32} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
