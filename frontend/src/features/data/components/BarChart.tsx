import type { ChartPoint } from "../../../types/domain";

interface BarChartProps {
  data: ChartPoint[];
}

export function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="flex h-full min-h-[220px] items-end gap-4 rounded-xl border border-white/10 bg-[#071112]/70 p-4">
      {data.map((point, index) => (
        <div className="flex flex-1 flex-col items-center gap-2" key={point.label}>
          <div className="flex h-32 w-full items-end justify-center gap-1">
            <span
              className="w-3 rounded-t bg-[#35d7c7]"
              style={{ height: `${Math.max((point.value / max) * 100, 14)}%` }}
            />
            <span
              className="w-3 rounded-t bg-[#f0b84d]"
              style={{ height: `${Math.max(((point.value - 8 + index) / max) * 100, 10)}%` }}
            />
          </div>
          <small className="text-xs text-white/50">{point.label}</small>
        </div>
      ))}
    </div>
  );
}
