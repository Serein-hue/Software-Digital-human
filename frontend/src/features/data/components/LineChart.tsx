import type { ChartPoint } from "../../../types/domain";

interface LineChartProps {
  data: ChartPoint[];
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export function LineChart({ data, activeIndex = data.length - 1, onActiveIndexChange }: LineChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const step = 420 / Math.max(data.length - 1, 1);
  const coordinates = data.map((point, index) => ({ x: index * step, y: 160 - (point.value / max) * 128, point, index }));
  const points = coordinates.map((coord) => `${coord.x},${coord.y}`);
  const area = `M${points[0]} L${points.slice(1).join(" L")} L420,180 L0,180 Z`;
  const active = coordinates[Math.min(Math.max(activeIndex, 0), coordinates.length - 1)] ?? coordinates[0];

  return (
    <div className="h-full min-h-[220px] rounded-xl border border-white/10 bg-[#071112]/70 p-4 text-white">
      <svg className="h-[190px] w-full" role="img" viewBox="0 0 420 190" aria-label="排队预测趋势">
        <path d="M0 160H420M0 118H420M0 76H420M0 34H420" stroke="rgba(255,255,255,.08)" />
        <path d={area} fill="url(#queueFill)" />
        <polyline fill="none" points={points.join(" ")} stroke="#35d7c7" strokeLinecap="round" strokeWidth="4" />
        <path d="M0 145 C86 120 154 84 230 70 C292 58 348 48 420 54" fill="none" stroke="#f0b84d" strokeDasharray="6 8" strokeWidth="3" />
        {active ? (
          <g>
            <path d={`M${active.x} 24V168`} stroke="rgba(255,255,255,.18)" strokeDasharray="4 7" />
            <circle cx={active.x} cy={active.y} fill="#071112" r="8" stroke="#35d7c7" strokeWidth="3" />
            <circle className="soft-pulse" cx={active.x} cy={active.y} fill="#35d7c7" opacity=".28" r="15" />
          </g>
        ) : null}
        {coordinates.map((coord) => (
          <circle
            aria-label={`${coord.point.label} ${coord.point.value}`}
            cx={coord.x}
            cy={coord.y}
            fill={coord.index === active?.index ? "#f0b84d" : "#35d7c7"}
            key={coord.point.label}
            onClick={() => onActiveIndexChange?.(coord.index)}
            onFocus={() => onActiveIndexChange?.(coord.index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onActiveIndexChange?.(coord.index);
            }}
            onMouseEnter={() => onActiveIndexChange?.(coord.index)}
            role="button"
            style={{ cursor: "pointer" }}
            tabIndex={0}
            r={coord.index === active?.index ? 5 : 4}
          />
        ))}
        <defs>
          <linearGradient id="queueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#35d7c7" stopOpacity=".32" />
            <stop offset="100%" stopColor="#35d7c7" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="grid grid-cols-4 gap-2 text-xs text-white/50">
        {data.filter((_, index) => index % 2 === 0).map((point, index) => (
          <button
            className="min-h-8 rounded-lg text-left transition hover:bg-white/[0.06] hover:text-white"
            key={point.label}
            onClick={() => onActiveIndexChange?.(index * 2)}
            type="button"
          >
            {point.label}
          </button>
        ))}
      </div>
      {active ? (
        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3 rounded-xl border border-[#35d7c7]/16 bg-[#35d7c7]/8 px-3 py-2">
          <span className="text-xs text-[#9fb8b4]">选中窗口：{active.point.label}</span>
          <strong className="font-mono text-lg text-[#8df0e5]">{active.point.value}</strong>
        </div>
      ) : null}
    </div>
  );
}
