export function RadarChart() {
  const labels = ["覆盖度 85", "准确度 92", "时效性 86", "完整度 90", "可用性 88"];

  return (
    <div className="grid h-full min-h-[220px] place-items-center rounded-xl border border-white/10 bg-[#071112]/70 p-4 text-white">
      <svg className="h-40 w-56" role="img" viewBox="0 0 220 160" aria-label="知识质量雷达图">
        <polygon points="110,12 202,62 176,148 44,148 18,62" fill="none" stroke="rgba(255,255,255,.15)" />
        <polygon points="110,38 174,74 154,126 66,126 46,74" fill="none" stroke="rgba(255,255,255,.12)" />
        <polygon points="110,24 184,68 160,132 64,134 36,70" fill="rgba(53,215,199,.22)" stroke="#35d7c7" strokeWidth="3" />
      </svg>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs text-white/65">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
