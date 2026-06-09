export function DonutChart() {
  return (
    <div className="grid h-full min-h-[220px] place-items-center rounded-xl border border-white/10 bg-[#071112]/70 p-4 text-white">
      <div className="relative grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#35d7c7_0_87%,#f0b84d_87%_96%,#ff6b5f_96%_100%)]">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[#071112] text-center">
          <strong className="text-2xl">15,682</strong>
          <span className="text-xs text-white/55">核验总数</span>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-white/72">
        <span><b className="mr-2 inline-block h-2 w-2 rounded-full bg-[#35d7c7]" />有效票 87.0%</span>
        <span><b className="mr-2 inline-block h-2 w-2 rounded-full bg-[#f0b84d]" />无票 9.0%</span>
        <span><b className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ff6b5f]" />异常票 4.0%</span>
      </div>
    </div>
  );
}
