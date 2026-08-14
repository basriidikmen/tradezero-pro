'use client';

/* ============================================================================
 *  TZ-1 / INSTITUTIONAL WEB TRADING TERMINAL
 *  ---------------------------------------------------------------------------
 *  Next.js 14/15 App Router · TypeScript · Tailwind CSS
 *  Zero external dependencies (no chart lib, no icon lib) — drop-in file.
 * ==========================================================================*/

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/* ==========================================================================
 * 1. PRIMITIVES — formatting, math, deterministic RNG
 * ========================================================================*/

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

const nf = (d: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

const num = (v: number, d = 2) => nf(d).format(v);

const usd = (v: number, d = 2) =>
  `${v < 0 ? '-' : ''}$${nf(d).format(Math.abs(v))}`;

const usdSigned = (v: number, d = 2) =>
  `${v < 0 ? '-' : '+'}$${nf(d).format(Math.abs(v))}`;

const pct = (v: number) => `${v >= 0 ? '+' : ''}${num(v, 2)}%`;

const compact = (v: number) => {
  if (Math.abs(v) >= 1e9) return `${num(v / 1e9, 2)}B`;
  if (Math.abs(v) >= 1e6) return `${num(v / 1e6, 2)}M`;
  if (Math.abs(v) >= 1e3) return `${num(v / 1e3, 0)}K`;
  return num(v, 0);
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const pad2 = (n: number) => String(n).padStart(2, '0');

const utcClock = (ts: number) => {
  const d = new Date(ts);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ==========================================================================
 * 2. DOMAIN TYPES
 * ========================================================================*/

type Timeframe = '1m' | '5m' | '1h' | '1D';
type Side = 'SHORT' | 'BUY';
type OrderType = 'Market' | 'Limit';
type Duration = 'Day' | 'GTC';

interface Quote {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  volume: number;
  float: number;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  tape: boolean;
  halted?: boolean;
}

interface Position {
  symbol: string;
  qty: number;
  entry: number;
}

interface WorkingOrder {
  id: string;
  symbol: string;
  side: Side;
  qty: number;
  limit: number;
  duration: Duration;
  placedAt: string;
}

interface Execution {
  id: string;
  time: string;
  symbol: string;
  side: Side | 'COVER' | 'SELL';
  qty: number;
  price: number;
  route: string;
}

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/* ==========================================================================
 * 3. SEED DATA - TERTEMİZ BAŞLANGIÇ
 * ========================================================================*/

const EQUITY_BASE = 1_000_000;
const REALIZED_OPEN = 0;
const MAINT_MARGIN = 0.3;
const BASE_TS = Date.UTC(2026, 7, 13, 6, 30, 0);

const SEED: Array<
  Omit<Quote, 'bid' | 'ask' | 'bidSize' | 'askSize' | 'prevClose'> & {
    chg: number;
  }
> = [
  { symbol: 'FGI',  name: 'FGI Industries Ltd.',        price: 11.7,  chg: 147.43, volume: 29_650_000, float: 2_100_000,  tape: false },
  { symbol: 'MYSZ', name: 'My Size Inc.',               price: 3.22,  chg: 672.46, volume: 41_200_000, float: 5_000_000,  tape: false },
  { symbol: 'XHG',  name: 'XChange TEC.INC',            price: 4.13,  chg: 424.56, volume: 88_400_000, float: 52_000_000, tape: false },
  { symbol: 'DFSC', name: 'Defiance Silver Corp.',      price: 2.34,  chg: 89.92,  volume: 12_900_000, float: 3_400_000,  tape: false },
  { symbol: 'GXAI', name: 'Gaxos.ai Inc.',              price: 1.3,   chg: 48.2,   volume: 63_100_000, float: 10_800_000, tape: false },
  { symbol: 'ARX',  name: 'Aeries Resource Exploration',price: 19.52, chg: 43.46,  volume: 9_450_000,  float: 218_000_000,tape: false },
  { symbol: 'CURI', name: 'CuriosityStream Inc.',       price: 3.95,  chg: 41.07,  volume: 22_300_000, float: 59_000_000, tape: false },
  { symbol: 'RRGB', name: 'Red Robin Gourmet Burgers',  price: 10.89, chg: 33.65,  volume: 7_800_000,  float: 18_000_000, tape: false },
  { symbol: 'LNSR', name: 'LENSAR Inc.',                price: 8.15,  chg: 29.57,  volume: 5_120_000,  float: 12_000_000, tape: false },
  { symbol: 'AIRO', name: 'AIRO Group Holdings',        price: 10.82, chg: 27.44,  volume: 31_700_000, float: 31_000_000, tape: false },
  { symbol: 'OMER', name: 'Omeros Corporation',         price: 17.37, chg: 26.62,  volume: 14_050_000, float: 72_000_000, tape: false },
  { symbol: 'SNTI', name: 'Senti Biosciences Inc.',     price: 6.44,  chg: 24.18,  volume: 8_640_000,  float: 9_200_000,  tape: false },
  { symbol: 'VRAX', name: 'Virax Biolabs Group',        price: 2.08,  chg: 21.05,  volume: 19_300_000, float: 4_100_000,  tape: false },
  { symbol: 'NUKK', name: 'Nukkleus Inc.',              price: 5.27,  chg: 20.41,  volume: 6_910_000,  float: 7_600_000,  tape: false },
  { symbol: 'CRM',  name: 'Salesforce Inc.',            price: 194.92,chg: 0.84,   volume: 4_100_000,  float: 960_000_000,   tape: true },
  { symbol: 'DIS',  name: 'Walt Disney Co.',            price: 104.66,chg: 1.4,    volume: 8_300_000,  float: 1_800_000_000, tape: true },
  { symbol: 'GE',   name: 'GE Aerospace',               price: 361.03,chg: -1.2,   volume: 3_200_000,  float: 1_070_000_000, tape: true },
  { symbol: 'GOOG', name: 'Alphabet Inc.',              price: 343.95,chg: 0.46,   volume: 12_400_000, float: 5_800_000_000, tape: true },
  { symbol: 'HD',   name: 'Home Depot Inc.',            price: 343.5, chg: 0.02,   volume: 2_900_000,  float: 990_000_000,   tape: true },
  { symbol: 'INTC', name: 'Intel Corporation',          price: 105.25,chg: 4.26,   volume: 44_800_000, float: 4_200_000_000, tape: true },
  { symbol: 'JPM',  name: 'JPMorgan Chase & Co.',       price: 363.99,chg: 0.31,   volume: 5_600_000,  float: 2_800_000_000, tape: true },
];

const INITIAL_QUOTES: Record<string, Quote> = Object.fromEntries(
  SEED.map((s) => {
    const spread = Math.max(0.01, +(s.price * 0.0007).toFixed(2));
    const q: Quote = {
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      prevClose: +(s.price / (1 + s.chg / 100)).toFixed(4),
      volume: s.volume,
      float: s.float,
      bid: +(s.price - spread).toFixed(2),
      ask: +(s.price + spread).toFixed(2),
      bidSize: 10,
      askSize: 100,
      tape: s.tape,
    };
    return [s.symbol, q];
  }),
);

const SCANNER_SYMBOLS = SEED.filter((s) => !s.tape).map((s) => s.symbol);
const TAPE_SYMBOLS = SEED.filter((s) => s.tape).map((s) => s.symbol);

const INITIAL_POSITIONS: Position[] = [];
const INITIAL_EXECUTIONS: Execution[] = [];

/* ==========================================================================
 * 4. MARKET ENGINE 
 * ========================================================================*/

function useMarket(feedOn: boolean) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(INITIAL_QUOTES);

  useEffect(() => {
    if (!feedOn) return;
    const id = window.setInterval(() => {
      setQuotes((prev) => {
        const next: Record<string, Quote> = {};
        for (const key of Object.keys(prev)) {
          const q = prev[key];
          const sigma = q.tape ? 0.0009 : q.price < 6 ? 0.0055 : 0.0038;
          const shock = Math.random() < 0.04 ? 3.2 : 1;
          const drift = (Math.random() - 0.497) * 2 * sigma * shock * q.price;
          const price = Math.max(0.05, +(q.price + drift).toFixed(2));
          const spread = Math.max(0.01, +(price * 0.0007).toFixed(2));
          next[key] = {
            ...q,
            price,
            bid: +(price - spread).toFixed(2),
            ask: +(price + spread).toFixed(2),
            bidSize: 1 + Math.floor(Math.random() * 40),
            askSize: 1 + Math.floor(Math.random() * 40),
            volume:
              q.volume +
              Math.floor(Math.random() * (q.tape ? 12_000 : 95_000)),
          };
        }
        return next;
      });
    }, 800);
    return () => window.clearInterval(id);
  }, [feedOn]);

  return quotes;
}

/* ==========================================================================
 * 5. CANDLE SERIES
 * ========================================================================*/

const TF_MINUTES: Record<Timeframe, number> = {
  '1m': 1,
  '5m': 5,
  '1h': 60,
  '1D': 1440,
};

function buildSeries(symbol: string, tf: Timeframe, count = 88): Candle[] {
  const seedQuote = INITIAL_QUOTES[symbol];
  const rnd = mulberry32(hashString(`${symbol}:${tf}`));
  const step = TF_MINUTES[tf] * 60_000;
  const vol = tf === '1m' ? 0.011 : tf === '5m' ? 0.02 : tf === '1h' ? 0.045 : 0.09;
  let level = 1;
  const raw: Candle[] = [];

  for (let i = 0; i < count; i++) {
    const progress = i / count;
    const trend = 0.0018 + Math.pow(progress, 5) * 0.052;
    const o = level;
    const noise = (rnd() - 0.44) * vol;
    const c = Math.max(0.05, o * (1 + trend + noise));
    const wick = vol * (0.35 + rnd());
    const h = Math.max(o, c) * (1 + rnd() * wick * 0.6);
    const l = Math.min(o, c) * (1 - rnd() * wick * 0.6);
    const body = Math.abs(c - o) / Math.max(o, 0.01);
    const v = Math.round((0.25 + rnd() * 0.7 + body * 24) * 1_000_00) * 10;
    raw.push({ t: BASE_TS + i * step, o, h, l, c, v });
    level = c;
  }

  const scale = seedQuote.price / raw[raw.length - 1].c;
  return raw.map((k) => ({
    t: k.t,
    o: +(k.o * scale).toFixed(3),
    h: +(k.h * scale).toFixed(3),
    l: +(k.l * scale).toFixed(3),
    c: +(k.c * scale).toFixed(3),
    v: k.v,
  }));
}

/* ==========================================================================
 * 6. SHARED UI ATOMS & MODERN PANEL STYLES
 * ========================================================================*/

const PANEL =
  'flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117]/70 backdrop-blur-xl shadow-2xl transition-all duration-300';

function PanelHeader({
  title,
  accent,
  right,
}: {
  title: React.ReactNode;
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_1px_rgba(16,185,129,0.8)]" />
        <h2 className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">
          {title}
        </h2>
        {accent && (
          <span className="font-mono text-[11px] font-bold text-emerald-400">
            {accent}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{right}</div>
    </header>
  );
}

function Flash({
  value,
  children,
  className,
}: {
  value: number;
  children: React.ReactNode;
  className?: string;
}) {
  const prev = useRef(value);
  const [dir, setDir] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    if (value > prev.current) setDir(1);
    else if (value < prev.current) setDir(-1);
    prev.current = value;
    const t = window.setTimeout(() => setDir(0), 400);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <span
      className={cx(
        'rounded-[4px] px-1 transition-colors duration-300',
        dir === 1 && 'bg-emerald-500/25',
        dir === -1 && 'bg-rose-500/25',
        className,
      )}
    >
      {children}
    </span>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-[6px] border border-white/[0.08] bg-black/60 p-0.5 shadow-inner">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cx(
            'rounded-[4px] font-mono uppercase tracking-wider transition-all duration-150',
            size === 'sm' ? 'px-2 py-[3px] text-[10px]' : 'px-3 py-1 text-[11px]',
            value === opt
              ? 'bg-emerald-500/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.45)]'
              : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-200',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'up' | 'down' | 'accent';
}) {
  return (
    <div className="flex flex-col justify-center border-l border-white/[0.06] px-3 sm:px-4 first:border-l-0">
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span
        className={cx(
          'font-mono text-[13px] sm:text-[14px] font-bold leading-tight tabular-nums tracking-tight',
          tone === 'up' && 'text-emerald-400',
          tone === 'down' && 'text-rose-400',
          tone === 'accent' && 'text-emerald-300',
          tone === 'neutral' && 'text-slate-100',
        )}
      >
        {value}
      </span>
      {sub && (
        <span className="font-mono text-[9px] leading-tight text-slate-500 hidden sm:block">
          {sub}
        </span>
      )}
    </div>
  );
}

/* ==========================================================================
 * 7. TOP BAR (MODERN)
 * ========================================================================*/

function TopBar({
  dayPnl,
  equity,
  buyingPower,
  marginUsed,
  feedOn,
  onToggleFeed,
  clock,
}: {
  dayPnl: number;
  equity: number;
  buyingPower: number;
  marginUsed: number;
  feedOn: boolean;
  onToggleFeed: () => void;
  clock: string;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 sm:gap-3 border-b border-white/[0.07] bg-[#040609]/90 backdrop-blur-md px-3 sm:px-4 z-50">
      <div className="flex items-center gap-2.5 pr-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_16px_-2px_rgba(16,185,129,0.8)]">
          <span className="font-mono text-[14px] font-black text-[#04140d]">
            TZ
          </span>
        </div>
        <div className="hidden leading-none sm:block">
          <div className="text-[14px] font-extrabold tracking-tight text-slate-100">
            TradeZero Pro
          </div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500/90 mt-0.5">
            Institutional
          </div>
        </div>
      </div>

      <nav className="hidden items-center gap-1 lg:flex ml-4">
        {['Trading', 'Research', 'Risk', 'Reports'].map((item, i) => (
          <button
            key={item}
            type="button"
            className={cx(
              'rounded-lg px-4 py-1.5 text-[12px] font-semibold transition-colors',
              i === 0
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-stretch xl:ml-auto">
        <Metric
          label="Day P&L"
          value={usdSigned(dayPnl)}
          tone={dayPnl > 0 ? 'up' : dayPnl < 0 ? 'down' : 'neutral'}
          sub={`${pct((dayPnl / EQUITY_BASE) * 100)} on equity`}
        />
        <div className="hidden md:contents">
          <Metric
            label="Portfolio Value"
            value={usd(equity)}
            tone="neutral"
            sub={`base ${usd(EQUITY_BASE, 0)}`}
          />
        </div>
        <div className="hidden lg:contents">
          <Metric
            label="Buying Power"
            value={usd(buyingPower)}
            tone="accent"
            sub={`margin ${usd(marginUsed, 0)}`}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-l border-white/[0.06] pl-3 sm:pl-4">
        <button
          type="button"
          onClick={onToggleFeed}
          aria-pressed={feedOn}
          className={cx(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors',
            feedOn
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-300',
          )}
        >
          <span
            className={cx(
              'h-1.5 w-1.5 rounded-full',
              feedOn
                ? 'animate-pulse bg-emerald-400 shadow-[0_0_8px_1px_rgba(16,185,129,0.9)]'
                : 'bg-amber-400',
            )}
          />
          <span className="hidden sm:block">{feedOn ? 'Feed live' : 'Feed paused'}</span>
        </button>
        <div className="hidden font-mono text-[12px] font-bold tabular-nums text-slate-300 sm:block">
          {clock}
        </div>
      </div>
    </header>
  );
}

/* ==========================================================================
 * 8. SCANNER 
 * ========================================================================*/

function ScannerPanel({
  quotes,
  active,
  onSelect,
}: {
  quotes: Record<string, Quote>;
  active: string;
  onSelect: (s: string) => void;
}) {
  const [preset, setPreset] = useState<'Pump' | 'Dump' | 'Dilution'>('Pump');

  const rows = useMemo(() => {
    const list = SCANNER_SYMBOLS.map((s) => {
      const q = quotes[s];
      const chg = (q.price / q.prevClose - 1) * 100;
      return { q, chg, rvol: q.volume / q.float };
    });
    if (preset === 'Dump') return list.sort((a, b) => a.chg - b.chg);
    if (preset === 'Dilution') return list.sort((a, b) => b.rvol - a.rvol);
    return list.sort((a, b) => b.chg - a.chg);
  }, [quotes, preset]);

  return (
    <section className={cx(PANEL, 'h-full')}>
      <PanelHeader
        title="Scanner"
        right={
          <span className="font-mono text-[10px] text-slate-500">
            {rows.length} matches
          </span>
        }
      />

      <div className="shrink-0 space-y-2 border-b border-white/[0.06] px-3 py-2.5 bg-black/20">
        <p className="text-[10px] font-medium leading-relaxed text-slate-500">
          <span className="text-slate-400 font-bold">Filters</span> · Common stock ·
          Chg&nbsp;&gt;&nbsp;20% · $1–$20 · Vol&nbsp;&gt;&nbsp;50K
        </p>
        <Segmented
          options={['Pump', 'Dump', 'Dilution'] as const}
          value={preset}
          onChange={setPreset}
        />
      </div>

      <div className="grid shrink-0 grid-cols-[52px_1fr_1fr_58px] gap-1 border-b border-white/[0.06] bg-black/50 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <span>Symbol</span>
        <span className="text-right">Price</span>
        <span className="text-right">Change</span>
        <span className="text-right">Vol</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map(({ q, chg, rvol }) => {
          const up = chg >= 0;
          const isActive = q.symbol === active;
          return (
            <button
              key={q.symbol}
              type="button"
              onClick={() => onSelect(q.symbol)}
              className={cx(
                'grid w-full grid-cols-[52px_1fr_1fr_58px] items-center gap-1 border-l-[3px] px-2.5 py-2 text-left font-mono text-[11px] tabular-nums transition-colors',
                isActive
                  ? 'border-l-emerald-400 bg-emerald-500/15'
                  : 'border-l-transparent hover:bg-white/[0.05]',
              )}
            >
              <span
                className={cx(
                  'truncate font-sans text-[12px] font-bold',
                  isActive ? 'text-emerald-300' : 'text-slate-200',
                )}
              >
                {q.symbol}
              </span>
              <span className="text-right font-medium text-slate-200">
                <Flash value={q.price}>{num(q.price)}</Flash>
              </span>
              <span
                className={cx(
                  'text-right font-bold',
                  up ? 'text-emerald-400' : 'text-rose-400',
                )}
              >
                {pct(chg)}
              </span>
              <span className="text-right font-medium text-slate-500">
                {compact(q.volume)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ==========================================================================
 * 9. HOTKEY DECK
 * ========================================================================*/

type HotkeyTone = 'short' | 'cover' | 'buy' | 'danger';

interface HotkeyDef {
  id: string;
  label: string;
  key: string;
  tone: HotkeyTone;
  hint: string;
}

const HOTKEYS: HotkeyDef[] = [
  { id: 'short100', label: 'SHORT-100', key: '1', tone: 'short',  hint: 'Sell short 100 shares' },
  { id: 'short1k',  label: 'SHORT-1K',  key: '2', tone: 'short',  hint: 'Sell short 1,000 shares' },
  { id: 'short10k', label: 'SHORT-10K', key: '3', tone: 'short',  hint: 'Sell short 10,000 shares' },
  { id: 'cover1k',  label: 'COVER-1K',  key: '4', tone: 'cover',  hint: 'Buy to cover 1,000 shares' },
  { id: 'cover10k', label: 'COVER-10K', key: '5', tone: 'cover',  hint: 'Buy to cover 10,000 shares' },
  { id: 'coverAll', label: 'COVER-ALL', key: '6', tone: 'cover',  hint: 'Close entire position' },
  { id: 'buy1k',    label: 'BUY-1K',    key: '7', tone: 'buy',    hint: 'Buy 1,000 shares at market' },
  { id: 'flat',     label: 'FLAT',      key: 'F', tone: 'danger', hint: 'Close every open position' },
  { id: 'cancel',   label: 'CANCEL',    key: 'Esc', tone: 'danger', hint: 'Cancel all working orders' },
];

const TONE_CLASS: Record<HotkeyTone, string> = {
  short:
    'border-rose-500/40 bg-gradient-to-b from-rose-500/20 to-rose-900/30 text-rose-200 hover:border-rose-400/80 hover:from-rose-500/30 hover:shadow-[0_0_20px_-4px_rgba(244,63,94,0.7)]',
  cover:
    'border-emerald-500/40 bg-gradient-to-b from-emerald-500/20 to-emerald-900/30 text-emerald-200 hover:border-emerald-400/80 hover:from-emerald-500/30 hover:shadow-[0_0_20px_-4px_rgba(16,185,129,0.7)]',
  buy: 'border-sky-500/40 bg-gradient-to-b from-sky-500/20 to-sky-900/30 text-sky-200 hover:border-sky-400/80 hover:from-sky-500/30 hover:shadow-[0_0_20px_-4px_rgba(56,189,248,0.7)]',
  danger:
    'border-amber-500/40 bg-gradient-to-b from-amber-500/20 to-amber-900/30 text-amber-200 hover:border-amber-400/80 hover:from-amber-500/30 hover:shadow-[0_0_20px_-4px_rgba(245,158,11,0.7)]',
};

function HotkeyDeck({
  symbol,
  armed,
  onArmedChange,
  onFire,
  firedId,
  executions,
}: {
  symbol: string;
  armed: boolean;
  onArmedChange: (v: boolean) => void;
  onFire: (id: string) => void;
  firedId: string | null;
  executions: Execution[];
}) {
  return (
    <section className={cx(PANEL, 'h-full')}>
      <PanelHeader
        title="Hotkey deck"
        accent={symbol}
        right={
          <button
            type="button"
            onClick={() => onArmedChange(!armed)}
            aria-pressed={armed}
            className={cx(
              'rounded-md border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors',
              armed
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm'
                : 'border-white/10 bg-white/[0.04] text-slate-500 hover:text-slate-300',
            )}
          >
            {armed ? 'Keys armed' : 'Keys off'}
          </button>
        }
      />

      <div className="grid shrink-0 grid-cols-3 gap-2 p-2.5">
        {HOTKEYS.map((hk) => (
          <button
            key={hk.id}
            type="button"
            title={hk.hint}
            onClick={() => onFire(hk.id)}
            className={cx(
              'group relative flex h-12 flex-col items-center justify-center rounded-lg border font-mono text-[11px] font-extrabold tracking-wide transition-all duration-100 active:translate-y-[2px] active:brightness-125 shadow-lg',
              TONE_CLASS[hk.tone],
              firedId === hk.id &&
                'translate-y-[2px] brightness-150 ring-2 ring-white/50',
            )}
          >
            <span>{hk.label}</span>
            <span className="absolute right-1.5 top-1.5 rounded-[3px] bg-black/50 px-1.5 py-0.5 text-[8px] font-bold text-white/60">
              {hk.key}
            </span>
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between border-y border-white/[0.06] bg-black/40 px-3 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Execution log
        </span>
        <span className="font-mono text-[9px] font-bold text-slate-500">
          route PAPER
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {executions.slice(0, 8).map((e) => (
          <div
            key={e.id}
            className="flex items-baseline justify-between gap-2 py-[4px] font-mono text-[10px] tabular-nums"
          >
            <span className="text-slate-500">{e.time}</span>
            <span
              className={cx(
                'w-14 font-bold',
                e.side === 'SHORT' || e.side === 'SELL'
                  ? 'text-rose-400'
                  : 'text-emerald-400',
              )}
            >
              {e.side}
            </span>
            <span className="flex-1 truncate font-semibold text-slate-200">{e.symbol}</span>
            <span className="text-slate-400">{compact(e.qty)}</span>
            <span className="w-16 text-right font-medium text-slate-200">
              {num(e.price)}
            </span>
          </div>
        ))}
        {executions.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 mb-2 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-lg opacity-50">⚡</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              İşlem geçmişi temiz.<br/>Kısayol tuşları ile emrinizi iletin.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
 * 10. CHART 
 * ========================================================================*/

const VB_W = 1000;
const VB_H = 420;
const PAD = { l: 10, r: 68, t: 14, b: 26 };

function ChartPanel({
  symbol,
  quote,
  timeframe,
  onTimeframeChange,
  position,
}: {
  symbol: string;
  quote: Quote;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  position?: Position;
}) {
  const base = useMemo(() => buildSeries(symbol, timeframe), [symbol, timeframe]);

  const candles = useMemo(() => {
    const out = base.slice();
    const last = { ...out[out.length - 1] };
    last.c = quote.price;
    last.h = Math.max(last.h, quote.price);
    last.l = Math.min(last.l, quote.price);
    out[out.length - 1] = last;
    return out;
  }, [base, quote.price]);

  const [hover, setHover] = useState<{ i: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const geom = useMemo(() => {
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const rawMax = Math.max(...highs);
    const rawMin = Math.min(...lows);
    const pad = (rawMax - rawMin) * 0.08 || 1;
    const max = rawMax + pad;
    const min = Math.max(0, rawMin - pad);

    const plotH = (VB_H - PAD.t - PAD.b) * 0.74;
    const volTop = PAD.t + plotH + 10;
    const volH = VB_H - PAD.b - volTop;
    const stepX = (VB_W - PAD.l - PAD.r) / candles.length;
    const maxVol = Math.max(...candles.map((c) => c.v));

    const x = (i: number) => PAD.l + (i + 0.5) * stepX;
    const y = (p: number) => PAD.t + ((max - p) / (max - min)) * plotH;

    return { min, max, plotH, volTop, volH, stepX, maxVol, x, y };
  }, [candles]);

  const handleMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = ((e.clientX - rect.left) / rect.width) * VB_W;
      const py = ((e.clientY - rect.top) / rect.height) * VB_H;
      const i = clamp(
        Math.floor((px - PAD.l) / geom.stepX),
        0,
        candles.length - 1,
      );
      setHover({ i, y: py });
    },
    [geom.stepX, candles.length],
  );

  const readout = candles[hover?.i ?? candles.length - 1];
  const readoutUp = readout.c >= readout.o;
  const chg = (quote.price / quote.prevClose - 1) * 100;
  const bodyW = Math.max(1.4, geom.stepX * 0.62);
  const gridLines = 5;

  return (
    <section className={cx(PANEL, 'h-full')}>
      <PanelHeader
        title="Chart"
        accent={symbol}
        right={
          <>
            <Segmented
              options={['1m', '5m', '1h', '1D'] as const}
              value={timeframe}
              onChange={onTimeframeChange}
            />
          </>
        }
      />

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/[0.06] bg-black/30 px-3 py-2 font-mono text-[10px] tabular-nums">
        <span className="text-[12px] font-extrabold text-slate-100">{symbol}</span>
        <span className="text-slate-500 font-medium">{timeframe} · NQNX</span>
        {(
          [
            ['O', readout.o],
            ['H', readout.h],
            ['L', readout.l],
            ['C', readout.c],
          ] as const
        ).map(([k, v]) => (
          <span key={k} className="text-slate-500 font-medium hidden sm:inline-block">
            {k}
            <span
              className={cx(
                'ml-1.5 font-bold',
                readoutUp ? 'text-emerald-400' : 'text-rose-400',
              )}
            >
              {num(v)}
            </span>
          </span>
        ))}
        <span className="text-slate-500 font-medium hidden sm:inline-block">
          Vol<span className="ml-1.5 font-bold text-sky-400">{compact(readout.v)}</span>
        </span>
        <span
          className={cx(
            'ml-auto font-extrabold text-[12px]',
            chg >= 0 ? 'text-emerald-400' : 'text-rose-400',
          )}
        >
          {num(quote.price)} {pct(chg)}
        </span>
      </div>

      <div className="min-h-0 flex-1 p-1 bg-black/10">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          className="h-full w-full touch-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Grid Lines */}
          {Array.from({ length: gridLines + 1 }, (_, i) => {
            const p = geom.min + ((geom.max - geom.min) * i) / gridLines;
            const y = geom.y(p);
            return (
              <g key={`g${i}`}>
                <line
                  x1={PAD.l}
                  x2={VB_W - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                />
                <text
                  x={VB_W - PAD.r + 10}
                  y={y + 3.5}
                  className="fill-slate-500 font-mono font-medium"
                  fontSize={10}
                >
                  {num(p)}
                </text>
              </g>
            );
          })}

          {/* Time axis */}
          {candles.map((c, i) =>
            i % Math.ceil(candles.length / 6) === 0 ? (
              <text
                key={`t${i}`}
                x={geom.x(i)}
                y={VB_H - 8}
                textAnchor="middle"
                className="fill-slate-500 font-mono font-medium"
                fontSize={10}
              >
                {utcClock(c.t)}
              </text>
            ) : null,
          )}

          {/* Volume */}
          {candles.map((c, i) => {
            const h = (c.v / geom.maxVol) * geom.volH;
            return (
              <rect
                key={`v${i}`}
                x={geom.x(i) - bodyW / 2}
                y={geom.volTop + geom.volH - h}
                width={bodyW}
                height={Math.max(0.6, h)}
                fill={c.c >= c.o ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}
              />
            );
          })}

          {/* Candles */}
          {candles.map((c, i) => {
            const up = c.c >= c.o;
            const color = up ? '#10b981' : '#f43f5e';
            const yO = geom.y(c.o);
            const yC = geom.y(c.c);
            const top = Math.min(yO, yC);
            const h = Math.max(1, Math.abs(yC - yO));
            return (
              <g key={`c${i}`}>
                <line
                  x1={geom.x(i)}
                  x2={geom.x(i)}
                  y1={geom.y(c.h)}
                  y2={geom.y(c.l)}
                  stroke={color}
                  strokeWidth={1.2}
                />
                <rect
                  x={geom.x(i) - bodyW / 2}
                  y={top}
                  width={bodyW}
                  height={h}
                  fill={color}
                  opacity={up ? 1 : 0.95}
                />
              </g>
            );
          })}

          {/* Position Line */}
          {position && position.qty !== 0 && (
            <g>
              <line
                x1={PAD.l}
                x2={VB_W - PAD.r}
                y1={geom.y(position.entry)}
                y2={geom.y(position.entry)}
                stroke={position.qty < 0 ? '#f43f5e' : '#38bdf8'}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <rect
                x={PAD.l}
                y={geom.y(position.entry) - 9}
                width={110}
                height={18}
                rx={3}
                fill={position.qty < 0 ? 'rgba(244,63,94,0.95)' : 'rgba(56,189,248,0.95)'}
              />
              <text
                x={PAD.l + 6}
                y={geom.y(position.entry) + 4}
                className="fill-white font-mono font-bold"
                fontSize={10}
              >
                {compact(position.qty)} @ {num(position.entry, 3)}
              </text>
            </g>
          )}

          {/* Last Price Marker */}
          <g>
            <line
              x1={PAD.l}
              x2={VB_W - PAD.r}
              y1={geom.y(quote.price)}
              y2={geom.y(quote.price)}
              stroke="rgba(16,185,129,0.7)"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <rect
              x={VB_W - PAD.r + 4}
              y={geom.y(quote.price) - 10}
              width={64}
              height={20}
              rx={4}
              fill="#10b981"
            />
            <text
              x={VB_W - PAD.r + 10}
              y={geom.y(quote.price) + 4}
              className="fill-[#04140d] font-mono font-extrabold"
              fontSize={11}
            >
              {num(quote.price)}
            </text>
          </g>

          {/* Crosshair */}
          {hover && (
            <g pointerEvents="none">
              <line
                x1={geom.x(hover.i)}
                x2={geom.x(hover.i)}
                y1={PAD.t}
                y2={VB_H - PAD.b}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
              />
              <line
                x1={PAD.l}
                x2={VB_W - PAD.r}
                y1={hover.y}
                y2={hover.y}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
              />
              <rect
                x={VB_W - PAD.r + 4}
                y={hover.y - 10}
                width={64}
                height={20}
                rx={4}
                fill="#1e293b"
                stroke="rgba(255,255,255,0.1)"
              />
              <text
                x={VB_W - PAD.r + 10}
                y={hover.y + 4}
                className="fill-white font-mono font-bold"
                fontSize={11}
              >
                {num(
                  geom.max -
                    ((hover.y - PAD.t) / geom.plotH) * (geom.max - geom.min),
                )}
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}

/* ==========================================================================
 * 11. PORTFOLIO 
 * ========================================================================*/

type BlotterTab = 'Open Positions' | 'Working Orders' | 'Executions';

function PortfolioPanel({
  positions,
  quotes,
  orders,
  executions,
  activeSymbol,
  onSelect,
  onCancelOrder,
  onFlatten,
  totals,
}: {
  positions: Position[];
  quotes: Record<string, Quote>;
  orders: WorkingOrder[];
  executions: Execution[];
  activeSymbol: string;
  onSelect: (s: string) => void;
  onCancelOrder: (id: string) => void;
  onFlatten: (s: string) => void;
  totals: { unrealized: number; exposure: number };
}) {
  const [tab, setTab] = useState<BlotterTab>('Open Positions');

  return (
    <section className={cx(PANEL, 'h-full')}>
      <PanelHeader
        title="Portfolio"
        right={
          <span className="font-mono text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded">TZPF56EA</span>
        }
      />

      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black/20 px-3 pt-2">
        {(['Open Positions', 'Working Orders', 'Executions'] as const).map(
          (t) => {
            const count =
              t === 'Open Positions'
                ? positions.length
                : t === 'Working Orders'
                  ? orders.length
                  : executions.length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cx(
                  'relative -mb-px flex items-center gap-1.5 px-3 pb-2 pt-1 text-[11px] font-bold transition-colors',
                  tab === t
                    ? 'text-emerald-300'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {t}
                <span className="rounded-md bg-white/[0.08] px-1.5 font-mono text-[10px] text-slate-300">
                  {count}
                </span>
                {tab === t && (
                  <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t-full bg-emerald-400 shadow-[0_0_8px_1px_rgba(16,185,129,0.7)]" />
                )}
              </button>
            );
          },
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'Open Positions' && (
          <table className="w-full min-w-[640px] border-collapse font-mono text-[11px] tabular-nums">
            <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur-md">
              <tr className="border-b border-white/[0.06] text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {['Symbol', 'Side', 'Qty', 'Entry', 'Last', 'Exposure', 'Unrealized', 'Chg%', ''].map(
                  (h, i) => (
                    <th
                      key={h + i}
                      className={cx(
                        'px-3 py-2',
                        i === 0 ? 'text-left' : 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const q = quotes[p.symbol];
                const pnl = (q.price - p.entry) * p.qty;
                const exposure = -Math.abs(p.qty) * q.price * Math.sign(p.qty);
                const chg = ((q.price - p.entry) / p.entry) * 100 * Math.sign(p.qty);
                const short = p.qty < 0;
                return (
                  <tr
                    key={p.symbol}
                    onClick={() => onSelect(p.symbol)}
                    className={cx(
                      'cursor-pointer border-b border-white/[0.04] transition-colors',
                      p.symbol === activeSymbol
                        ? 'bg-emerald-500/[0.12]'
                        : 'hover:bg-white/[0.05]',
                    )}
                  >
                    <td className="px-3 py-[8px] text-left font-sans text-[12px] font-extrabold text-slate-100">
                      {p.symbol}
                    </td>
                    <td
                      className={cx(
                        'px-3 py-[8px] text-right font-bold',
                        short ? 'text-rose-400' : 'text-emerald-400',
                      )}
                    >
                      {short ? 'SHORT' : 'LONG'}
                    </td>
                    <td className="px-3 py-[8px] text-right font-medium text-slate-200">
                      {num(p.qty, 0)}
                    </td>
                    <td className="px-3 py-[8px] text-right font-medium text-slate-400">
                      {num(p.entry, 3)}
                    </td>
                    <td className="px-3 py-[8px] text-right font-bold text-slate-100">
                      <Flash value={q.price}>{num(q.price)}</Flash>
                    </td>
                    <td className="px-3 py-[8px] text-right font-medium text-slate-400">
                      {usd(exposure, 0)}
                    </td>
                    <td
                      className={cx(
                        'px-3 py-[8px] text-right font-bold',
                        pnl >= 0 ? 'text-emerald-400' : 'text-rose-400',
                      )}
                    >
                      {usdSigned(pnl)}
                    </td>
                    <td
                      className={cx(
                        'px-3 py-[8px] text-right font-bold',
                        chg >= 0 ? 'text-emerald-400' : 'text-rose-400',
                      )}
                    >
                      {pct(chg)}
                    </td>
                    <td className="px-3 py-[8px] text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFlatten(p.symbol);
                        }}
                        className="rounded border border-white/10 px-2 py-1 text-[9px] font-bold uppercase text-slate-400 transition-colors hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-200"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center">
                     <div className="flex flex-col items-center justify-center text-slate-500">
                        <span className="text-2xl opacity-40 mb-2">📊</span>
                        <span className="text-[12px] font-medium">Portföy boş. İşlem yapmaya hazırsınız.</span>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
            {positions.length > 0 && (
              <tfoot className="sticky bottom-0 bg-black/60 backdrop-blur-md">
                <tr className="border-t border-white/[0.1] text-[11px]">
                  <td className="px-3 py-2.5 text-left font-bold uppercase tracking-wider text-slate-300">
                    Total
                  </td>
                  <td colSpan={4} />
                  <td className="px-3 py-2.5 text-right font-medium text-slate-300">
                    {usd(-totals.exposure, 0)}
                  </td>
                  <td
                    className={cx(
                      'px-3 py-2.5 text-right text-[12px] font-extrabold',
                      totals.unrealized >= 0 ? 'text-emerald-400' : 'text-rose-400',
                    )}
                  >
                    {usdSigned(totals.unrealized)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        )}

        {tab === 'Working Orders' && (
          <table className="w-full min-w-[560px] border-collapse font-mono text-[11px] tabular-nums">
            <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur-md">
              <tr className="border-b border-white/[0.06] text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {['Placed', 'Symbol', 'Side', 'Qty', 'Limit', 'Last', 'TIF', ''].map(
                  (h, i) => (
                    <th
                      key={h + i}
                      className={cx(
                        'px-3 py-2',
                        i === 1 ? 'text-left' : 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.05]"
                >
                  <td className="px-3 py-[8px] text-right font-medium text-slate-500">
                    {o.placedAt}
                  </td>
                  <td className="px-3 py-[8px] text-left font-sans font-extrabold text-slate-100">
                    {o.symbol}
                  </td>
                  <td
                    className={cx(
                      'px-3 py-[8px] text-right font-bold',
                      o.side === 'SHORT' ? 'text-rose-400' : 'text-emerald-400',
                    )}
                  >
                    {o.side}
                  </td>
                  <td className="px-3 py-[8px] text-right font-medium text-slate-200">
                    {num(o.qty, 0)}
                  </td>
                  <td className="px-3 py-[8px] text-right font-bold text-slate-100">
                    {num(o.limit)}
                  </td>
                  <td className="px-3 py-[8px] text-right font-medium text-slate-400">
                    {num(quotes[o.symbol]?.price ?? 0)}
                  </td>
                  <td className="px-3 py-[8px] text-right font-medium text-slate-500">
                    {o.duration}
                  </td>
                  <td className="px-3 py-[8px] text-right">
                    <button
                      type="button"
                      onClick={() => onCancelOrder(o.id)}
                      className="rounded border border-white/10 px-2 py-1 text-[9px] font-bold uppercase text-slate-400 transition-colors hover:border-amber-500/50 hover:bg-amber-500/20 hover:text-amber-200"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                        <span className="text-2xl opacity-40 mb-2">⏳</span>
                        <span className="text-[12px] font-medium">Aktif bekleyen emir bulunmuyor.</span>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {tab === 'Executions' && (
          <table className="w-full min-w-[520px] border-collapse font-mono text-[11px] tabular-nums">
            <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur-md">
              <tr className="border-b border-white/[0.06] text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {['Time', 'Symbol', 'Side', 'Qty', 'Price', 'Value', 'Route'].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={cx(
                        'px-3 py-2',
                        i === 1 ? 'text-left' : 'text-right',
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {executions.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.05]"
                >
                  <td className="px-3 py-[8px] text-right font-medium text-slate-500">
                    {e.time}
                  </td>
                  <td className="px-3 py-[8px] text-left font-sans font-extrabold text-slate-100">
                    {e.symbol}
                  </td>
                  <td
                    className={cx(
                      'px-3 py-[8px] text-right font-bold',
                      e.side === 'SHORT' || e.side === 'SELL'
                        ? 'text-rose-400'
                        : 'text-emerald-400',
                    )}
                  >
                    {e.side}
                  </td>
                  <td className="px-3 py-[8px] text-right font-medium text-slate-200">
                    {num(e.qty, 0)}
                  </td>
                  <td className="px-3 py-[8px] text-right font-bold text-slate-100">
                    {num(e.price)}
                  </td>
                  <td className="px-3 py-[8px] text-right font-medium text-slate-400">
                    {usd(e.qty * e.price, 0)}
                  </td>
                  <td className="px-3 py-[8px] text-right font-bold text-slate-600">
                    {e.route}
                  </td>
                </tr>
              ))}
               {executions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                        <span className="text-[12px] font-medium">Bu oturumda gerçekleşen işlem yok.</span>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
 * 12. ORDER TICKET
 * ========================================================================*/

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const INPUT =
  'h-10 w-full rounded-lg border border-white/[0.08] bg-black/60 px-3 font-mono text-[14px] tabular-nums text-slate-100 outline-none transition-colors focus:border-emerald-500/60 focus:bg-black/80 shadow-inner';

function OrderTicket({
  quote,
  position,
  buyingPower,
  onSubmit,
}: {
  quote: Quote;
  position?: Position;
  buyingPower: number;
  onSubmit: (o: {
    side: Side;
    qty: number;
    type: OrderType;
    limit: number;
    duration: Duration;
  }) => void;
}) {
  const [side, setSide] = useState<Side>('SHORT');
  const [qty, setQty] = useState(1_000);
  const [type, setType] = useState<OrderType>('Market');
  const [duration, setDuration] = useState<Duration>('Day');
  const [limit, setLimit] = useState<number>(quote.price);
  const [display, setDisplay] = useState<number | ''>('');

  const symbolRef = useRef(quote.symbol);
  useEffect(() => {
    if (symbolRef.current !== quote.symbol) {
      symbolRef.current = quote.symbol;
      setLimit(quote.price);
    }
  }, [quote.symbol, quote.price]);

  const refPrice = type === 'Limit' ? limit : side === 'SHORT' ? quote.bid : quote.ask;
  const notional = qty * refPrice;
  const chg = (quote.price / quote.prevClose - 1) * 100;
  const insufficient = notional > buyingPower;

  const submit = () => {
    if (qty <= 0 || insufficient) return;
    onSubmit({ side, qty, type, limit, duration });
  };

  return (
    <section className={cx(PANEL, 'h-full')}>
      <PanelHeader title="Order ticket" accent={quote.symbol} />

      <div className="shrink-0 border-b border-white/[0.06] bg-black/20 px-3 py-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/[0.05] border border-white/5 font-mono text-[16px] font-extrabold text-slate-200">
            {quote.symbol.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-slate-400">{quote.name}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-[24px] font-extrabold leading-tight tabular-nums text-white">
                <Flash value={quote.price}>{num(quote.price)}</Flash>
              </span>
              <span
                className={cx(
                  'font-mono text-[12px] font-bold',
                  chg >= 0 ? 'text-emerald-400' : 'text-rose-400',
                )}
              >
                {usdSigned(quote.price - quote.prevClose)} {pct(chg)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 font-mono text-[10px] tabular-nums">
          {[
            { k: 'Bid', v: num(quote.bid), s: `x${quote.bidSize}`, tone: 'text-emerald-400' },
            { k: 'Ask', v: num(quote.ask), s: `x${quote.askSize}`, tone: 'text-rose-400' },
            { k: 'Vol', v: compact(quote.volume), s: 'today', tone: 'text-slate-200' },
            {
              k: 'Pos',
              v: position ? num(position.qty, 0) : '0',
              s: position ? num(position.entry, 3) : 'flat',
              tone: position
                ? position.qty < 0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
                : 'text-slate-400',
            },
          ].map((c) => (
            <div
              key={c.k}
              className="rounded-md border border-white/[0.06] bg-black/40 px-2 py-1.5 shadow-inner"
            >
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {c.k}
              </div>
              <div className={cx('font-extrabold text-[12px]', c.tone)}>{c.v}</div>
              <div className="text-[9px] font-medium text-slate-600">{c.s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 bg-black/10">
        <Field label="Action">
          <div className="grid grid-cols-2 gap-2">
            {(['SHORT', 'BUY'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                aria-pressed={side === s}
                className={cx(
                  'h-11 rounded-lg border font-mono text-[13px] font-extrabold tracking-wide transition-all shadow-md',
                  side === s
                    ? s === 'SHORT'
                      ? 'border-rose-500/70 bg-rose-500/20 text-rose-200 shadow-[0_0_16px_-4px_rgba(244,63,94,0.6)]'
                      : 'border-emerald-500/70 bg-emerald-500/20 text-emerald-200 shadow-[0_0_16px_-4px_rgba(16,185,129,0.6)]'
                    : 'border-white/[0.08] bg-black/50 text-slate-500 hover:text-slate-300 hover:bg-black/70',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Quantity">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(0, q - 100))}
              className="grid h-10 w-12 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-black/50 text-slate-400 font-bold text-lg transition-colors hover:border-white/20 hover:text-slate-100 hover:bg-black/70"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              step={100}
              value={qty}
              onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
              className={cx(INPUT, 'text-center font-bold')}
            />
            <button
              type="button"
              onClick={() => setQty((q) => q + 100)}
              className="grid h-10 w-12 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-black/50 text-slate-400 font-bold text-lg transition-colors hover:border-white/20 hover:text-slate-100 hover:bg-black/70"
            >
              +
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-4 gap-2">
          {[100, 1_000, 10_000, 25_000].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQty(n)}
              className={cx(
                'h-8 rounded-[5px] border font-mono text-[11px] font-bold transition-colors',
                qty === n
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/[0.08] bg-black/40 text-slate-500 hover:text-slate-300 hover:bg-black/60',
              )}
            >
              {compact(n)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Order type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OrderType)}
              className={cx(INPUT, 'cursor-pointer font-bold')}
            >
              <option>Market</option>
              <option>Limit</option>
            </select>
          </Field>
          <Field label="Duration">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
              className={cx(INPUT, 'cursor-pointer font-bold')}
            >
              <option>Day</option>
              <option>GTC</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Route">
            <div className="flex h-10 items-center justify-between rounded-lg border border-white/[0.08] bg-black/70 px-3 font-mono text-[13px] font-bold text-slate-400 shadow-inner">
              PAPER
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-slate-500 stroke-[2]">
                <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2" />
              </svg>
            </div>
          </Field>
          <Field label={type === 'Limit' ? 'Limit price' : 'Display qty'}>
            {type === 'Limit' ? (
              <input
                type="number"
                step={0.01}
                min={0}
                value={limit}
                onChange={(e) => setLimit(Math.max(0, Number(e.target.value) || 0))}
                className={cx(INPUT, 'font-bold')}
              />
            ) : (
              <input
                type="number"
                min={0}
                placeholder="—"
                value={display}
                onChange={(e) =>
                  setDisplay(e.target.value === '' ? '' : Number(e.target.value))
                }
                className={cx(INPUT, 'placeholder:text-slate-600 font-bold')}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] bg-black/40 p-3">
        <dl className="mb-3 space-y-1.5 font-mono text-[11px] tabular-nums">
          <div className="flex justify-between">
            <dt className="text-slate-500 font-bold">
              {side === 'SHORT' ? 'Est. proceeds' : 'Est. cost'}
            </dt>
            <dd className="font-extrabold text-slate-100">{usd(notional)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 font-bold">Fees &amp; commissions</dt>
            <dd className="text-slate-400 font-medium">$0.00</dd>
          </div>
          <div className="flex justify-between pt-1 border-t border-white/5">
            <dt className="text-slate-400 font-bold">Buying power after</dt>
            <dd
              className={cx(
                'font-extrabold text-[12px]',
                insufficient ? 'text-rose-400' : 'text-emerald-400',
              )}
            >
              {usd(buyingPower - notional * MAINT_MARGIN)}
            </dd>
          </div>
        </dl>

        {insufficient && (
          <p className="mb-3 rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-300">
            Order exceeds buying power. Lower the quantity to continue.
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={qty <= 0 || insufficient}
          className={cx(
            'h-12 w-full rounded-lg border font-mono text-[15px] font-black uppercase tracking-[0.15em] transition-all active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40',
            side === 'SHORT'
              ? 'border-rose-400/60 bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_10px_30px_-10px_rgba(244,63,94,0.8)] hover:from-rose-400 hover:to-rose-600'
              : 'border-emerald-400/60 bg-gradient-to-b from-emerald-500 to-emerald-700 text-[#04140d] shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] hover:from-emerald-400 hover:to-emerald-600',
          )}
        >
          {side === 'SHORT' ? 'Sell short' : 'Buy'} {compact(qty)} {quote.symbol}
        </button>
      </div>
    </section>
  );
}

/* ==========================================================================
 * 13. TICKER TAPE
 * ========================================================================*/

function TickerTape({ quotes }: { quotes: Record<string, Quote> }) {
  const items = TAPE_SYMBOLS.map((s) => quotes[s]);
  return (
    <div className="relative h-8 shrink-0 overflow-hidden border-t border-white/[0.07] bg-[#040609]">
      <div className="tape-track flex h-full w-max items-center gap-10 whitespace-nowrap px-4">
        {[0, 1].map((dup) =>
          items.map((q) => {
            const chg = q.price - q.prevClose;
            const up = chg >= 0;
            return (
              <span
                key={`${dup}-${q.symbol}`}
                className="flex items-baseline gap-2.5 font-mono text-[11px] tabular-nums"
              >
                <span className="font-extrabold text-slate-200">{q.symbol}</span>
                <span className="font-medium text-slate-100">{num(q.price)}</span>
                <span className={cx('font-bold', up ? 'text-emerald-400' : 'text-rose-400')}>
                  {usdSigned(chg)}
                </span>
              </span>
            );
          }),
        )}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#040609] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#040609] to-transparent" />
    </div>
  );
}

/* ==========================================================================
 * 14. ROOT — TRADING TERMINAL
 * ========================================================================*/

export default function TradingTerminal() {
  const [feedOn, setFeedOn] = useState(true);
  const quotes = useMarket(feedOn);

  const [symbol, setSymbol] = useState('FGI');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');

  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [orders, setOrders] = useState<WorkingOrder[]>([]);
  const [executions, setExecutions] = useState<Execution[]>(INITIAL_EXECUTIONS);
  const [sessionRealized, setSessionRealized] = useState(0);

  const [armed, setArmed] = useState(true);
  const [firedId, setFiredId] = useState<string | null>(null);
  const [clock, setClock] = useState('--:--:--');
  const [toast, setToast] = useState<string | null>(null);

  // MOBIL TAB STATE - BURASI KRITIK
  const [mobileTab, setMobileTab] = useState<'trade' | 'scanner' | 'portfolio'>('trade');

  const quote = quotes[symbol];
  const position = positions.find((p) => p.symbol === symbol);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`,
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const stamp = () => {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  };

  const applyFill = useCallback(
    (sym: string, deltaQty: number, price: number, label: Execution['side']) => {
      if (deltaQty === 0) return;

      setPositions((prev) => {
        const idx = prev.findIndex((p) => p.symbol === sym);
        if (idx === -1) {
          return [...prev, { symbol: sym, qty: deltaQty, entry: price }];
        }
        const p = prev[idx];
        const nextQty = p.qty + deltaQty;
        const sameSide = Math.sign(deltaQty) === Math.sign(p.qty);

        let entry = p.entry;
        let realized = 0;

        if (sameSide) {
          entry =
            (p.entry * Math.abs(p.qty) + price * Math.abs(deltaQty)) /
            (Math.abs(p.qty) + Math.abs(deltaQty));
        } else {
          const closed = Math.min(Math.abs(deltaQty), Math.abs(p.qty));
          realized = (price - p.entry) * closed * Math.sign(p.qty);
          if (Math.abs(deltaQty) > Math.abs(p.qty)) entry = price;
        }

        if (realized !== 0) {
          window.setTimeout(() => setSessionRealized((r) => r + realized), 0);
        }

        const next = prev.slice();
        if (nextQty === 0) next.splice(idx, 1);
        else next[idx] = { symbol: sym, qty: nextQty, entry: +entry.toFixed(4) };
        return next;
      });

      setExecutions((prev) => [
        {
          id: `x-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          time: stamp(),
          symbol: sym,
          side: label,
          qty: Math.abs(deltaQty),
          price,
          route: 'PAPER',
        },
        ...prev,
      ]);
    },
    [],
  );

  const { unrealized, exposure } = useMemo(() => {
    let u = 0;
    let e = 0;
    for (const p of positions) {
      const q = quotes[p.symbol];
      if (!q) continue;
      u += (q.price - p.entry) * p.qty;
      e += Math.abs(p.qty) * q.price;
    }
    return { unrealized: u, exposure: e };
  }, [positions, quotes]);

  const marginUsed = exposure * MAINT_MARGIN;
  const dayPnl = REALIZED_OPEN + sessionRealized + unrealized;
  const equity = EQUITY_BASE + sessionRealized + unrealized;
  const buyingPower = Math.max(0, equity - marginUsed);

  useEffect(() => {
    if (orders.length === 0) return;
    const filled: WorkingOrder[] = [];
    for (const o of orders) {
      const q = quotes[o.symbol];
      if (!q) continue;
      const hit = o.side === 'SHORT' ? q.price >= o.limit : q.price <= o.limit;
      if (hit) filled.push(o);
    }
    if (filled.length === 0) return;

    setOrders((prev) => prev.filter((o) => !filled.some((f) => f.id === o.id)));
    for (const f of filled) {
      applyFill(
        f.symbol,
        f.side === 'SHORT' ? -f.qty : f.qty,
        f.limit,
        f.side,
      );
      notify(`Filled ${f.side} ${compact(f.qty)} ${f.symbol} @ ${num(f.limit)}`);
    }
  }, [quotes, orders, applyFill, notify]);

  const fireHotkey = useCallback(
    (id: string) => {
      setFiredId(id);
      window.setTimeout(() => setFiredId(null), 160);

      const q = quotes[symbol];
      if (!q) return;
      const pos = positions.find((p) => p.symbol === symbol);

      switch (id) {
        case 'short100':
        case 'short1k':
        case 'short10k': {
          const size = id === 'short100' ? 100 : id === 'short1k' ? 1_000 : 10_000;
          applyFill(symbol, -size, q.bid, 'SHORT');
          notify(`Short ${compact(size)} ${symbol} @ ${num(q.bid)}`);
          break;
        }
        case 'cover1k':
        case 'cover10k': {
          if (!pos || pos.qty >= 0) {
            notify(`No short position open in ${symbol}`);
            break;
          }
          const size = Math.min(
            id === 'cover1k' ? 1_000 : 10_000,
            Math.abs(pos.qty),
          );
          applyFill(symbol, size, q.ask, 'COVER');
          notify(`Cover ${compact(size)} ${symbol} @ ${num(q.ask)}`);
          break;
        }
        case 'coverAll': {
          if (!pos) {
            notify(`Already flat in ${symbol}`);
            break;
          }
          applyFill(symbol, -pos.qty, pos.qty < 0 ? q.ask : q.bid, pos.qty < 0 ? 'COVER' : 'SELL');
          notify(`Closed ${symbol} · ${compact(Math.abs(pos.qty))} shares`);
          break;
        }
        case 'buy1k': {
          applyFill(symbol, 1_000, q.ask, 'BUY');
          notify(`Bought 1K ${symbol} @ ${num(q.ask)}`);
          break;
        }
        case 'flat': {
          if (positions.length === 0) {
            notify('Account is already flat');
            break;
          }
          for (const p of positions) {
            const pq = quotes[p.symbol];
            applyFill(
              p.symbol,
              -p.qty,
              p.qty < 0 ? pq.ask : pq.bid,
              p.qty < 0 ? 'COVER' : 'SELL',
            );
          }
          notify(`Flattened ${positions.length} positions`);
          break;
        }
        case 'cancel': {
          if (orders.length === 0) {
            notify('No working orders to cancel');
            break;
          }
          notify(`Cancelled ${orders.length} working orders`);
          setOrders([]);
          break;
        }
        default:
          break;
      }
    },
    [applyFill, notify, orders.length, positions, quotes, symbol],
  );

  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'SELECT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);
      if (typing) return;

      const key = e.key === 'Escape' ? 'Esc' : e.key.toUpperCase();
      const hk = HOTKEYS.find((h) => h.key.toUpperCase() === key);
      if (!hk) return;
      e.preventDefault();
      fireHotkey(hk.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [armed, fireHotkey]);

  const handleSubmitOrder = useCallback(
    (o: {
      side: Side;
      qty: number;
      type: OrderType;
      limit: number;
      duration: Duration;
    }) => {
      const q = quotes[symbol];
      if (!q) return;

      if (o.type === 'Market') {
        const px = o.side === 'SHORT' ? q.bid : q.ask;
        applyFill(symbol, o.side === 'SHORT' ? -o.qty : o.qty, px, o.side);
        notify(`${o.side} ${compact(o.qty)} ${symbol} filled @ ${num(px)}`);
        return;
      }

      setOrders((prev) => [
        {
          id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          symbol,
          side: o.side,
          qty: o.qty,
          limit: o.limit,
          duration: o.duration,
          placedAt: stamp(),
        },
        ...prev,
      ]);
      notify(`Working ${o.side} ${compact(o.qty)} ${symbol} @ ${num(o.limit)}`);
    },
    [applyFill, notify, quotes, symbol],
  );

  const flattenSymbol = useCallback(
    (sym: string) => {
      const p = positions.find((x) => x.symbol === sym);
      const q = quotes[sym];
      if (!p || !q) return;
      applyFill(sym, -p.qty, p.qty < 0 ? q.ask : q.bid, p.qty < 0 ? 'COVER' : 'SELL');
      notify(`Closed ${sym}`);
    },
    [applyFill, notify, positions, quotes],
  );

  return (
    <>
      {/* Alttan sırıtan beyazlığı ve kaydırma sekmesini kökten çözen stil eklentisi */}
      <style dangerouslySetInnerHTML={{__html: `
        html, body { 
          background-color: #040609 !important; 
          overscroll-behavior: none; 
        }
      `}} />
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#040609] text-slate-200 antialiased selection:bg-emerald-500/30">
        <style>{`
          @keyframes tapeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .tape-track { animation: tapeScroll 45s linear infinite; }
          @media (prefers-reduced-motion: reduce) {
            .tape-track { animation: none; }
          }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 4px; border: 1px solid #040609; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.5); }
          input[type=number]::-webkit-outer-spin-button,
          input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
        `}</style>

        <TopBar
          dayPnl={dayPnl}
          equity={equity}
          buyingPower={buyingPower}
          marginUsed={marginUsed}
          feedOn={feedOn}
          onToggleFeed={() => setFeedOn((v) => !v)}
          clock={clock}
        />

        {/* Paper trading banner */}
        <div className="flex h-8 shrink-0 items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 text-center text-[10px] sm:text-[11px] font-bold tracking-wide text-amber-200/90 shadow-inner z-40">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="truncate">SIMULATED MARKET DATA. ORDERS ROUTE TO PAPER VENUE (TZPF56EA)</span>
        </div>

        {/* Workspace - MASAÜSTÜNDE GRID, MOBİLDE FLEX + TAB MANTIĞI */}
        <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-2 relative z-10 flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-[1.35fr_1fr] gap-2">
          
          {/* Arkadaki dekoratif TradeZero parlamaları */}
          <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Scanner Panel */}
          <div className={cx(
            "min-h-[500px] lg:min-h-0 lg:col-span-3 lg:col-start-1 lg:row-start-1 flex flex-col z-10",
            mobileTab !== 'scanner' && "hidden lg:flex"
          )}>
            <ScannerPanel
              quotes={quotes}
              active={symbol}
              onSelect={setSymbol}
            />
          </div>

          {/* Chart Panel (Trade sekmesi) */}
          <div className={cx(
            "min-h-[400px] lg:min-h-0 lg:col-span-6 lg:col-start-4 lg:row-start-1 flex flex-col z-10",
            mobileTab !== 'trade' && "hidden lg:flex"
          )}>
            <ChartPanel
              symbol={symbol}
              quote={quote}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              position={position}
            />
          </div>

          {/* Hotkey Deck (Mobilde Trade sekmesine dahil edildi) */}
          <div className={cx(
            "min-h-[250px] lg:min-h-0 lg:col-span-3 lg:col-start-1 lg:row-start-2 flex flex-col z-10",
            mobileTab !== 'trade' && "hidden lg:flex"
          )}>
            <HotkeyDeck
              symbol={symbol}
              armed={armed}
              onArmedChange={setArmed}
              onFire={fireHotkey}
              firedId={firedId}
              executions={executions}
            />
          </div>

          {/* Order Ticket (Trade sekmesi) */}
          <div className={cx(
            "min-h-[580px] lg:min-h-0 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:row-span-2 flex flex-col z-10",
            mobileTab !== 'trade' && "hidden lg:flex"
          )}>
            <OrderTicket
              quote={quote}
              position={position}
              buyingPower={buyingPower}
              onSubmit={handleSubmitOrder}
            />
          </div>

          {/* Portfolio Panel */}
          <div className={cx(
            "min-h-[500px] lg:min-h-0 lg:col-span-6 lg:col-start-4 lg:row-start-2 flex flex-col z-10",
            mobileTab !== 'portfolio' && "hidden lg:flex"
          )}>
            <PortfolioPanel
              positions={positions}
              quotes={quotes}
              orders={orders}
              executions={executions}
              activeSymbol={symbol}
              onSelect={setSymbol}
              onCancelOrder={(id) =>
                setOrders((prev) => prev.filter((o) => o.id !== id))
              }
              onFlatten={flattenSymbol}
              totals={{ unrealized, exposure }}
            />
          </div>

        </main>

        <TickerTape quotes={quotes} />

        {/* MOBİL İÇİN ÖZEL ALT NAVİGASYON (TAB BAR) */}
        <div className="lg:hidden shrink-0 flex items-center justify-between border-t border-white/[0.08] bg-[#040609]/95 backdrop-blur-xl px-2 py-2 z-50">
          {[
            { id: 'scanner', label: 'Scanner', icon: '🔍' },
            { id: 'trade', label: 'Trade', icon: '⚡' },
            { id: 'portfolio', label: 'Portfolio', icon: '💼' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id as any)}
              className={cx(
                "flex flex-1 flex-col items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all",
                mobileTab === t.id 
                  ? "text-emerald-400 bg-emerald-500/10 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
              )}
            >
              <span className="text-[18px]">{t.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Fill toast */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed bottom-24 lg:bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-500/40 bg-[#04140d]/95 px-6 py-3 font-mono text-[13px] font-bold text-emerald-300 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.9)] backdrop-blur-md whitespace-nowrap"
          >
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
