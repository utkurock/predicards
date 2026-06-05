type Props = {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  fill?: boolean;
};

export function Sparkline({ data, color = "#207CFF", height = 36, className, fill = true }: Props) {
  if (data.length < 2) return null;
  const w = 100;
  const h = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 0.0001);
  // Round to 3 decimals so SSR (Node V8) and CSR (browser V8) produce identical
  // path strings — bare floats diverge at the ULP level and trip hydration mismatches.
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const points = data.map((v, i) => {
    const x = r3((i / (data.length - 1)) * w);
    const y = r3(h - ((v - min) / range) * h * 0.85 - h * 0.05);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const areaPath = `${path} L${w},${h} L0,${h} Z`;
  const gradId = `g-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Deterministic mock data generator
export function genSpark(seed: number, n = 24, volatility = 0.15): number[] {
  let v = 50;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const rnd = Math.sin(seed * (i + 1) * 9.31) * 43758.5453;
    const noise = (rnd - Math.floor(rnd)) - 0.5;
    v += noise * volatility * 50;
    v = Math.max(5, Math.min(95, v));
    out.push(v);
  }
  return out;
}
