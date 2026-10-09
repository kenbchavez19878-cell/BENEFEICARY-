import imgImage511 from "figma:asset/aa40af48e9f7209ae7f0669fa9e7f1d7e9f17097.png";

function Group() {
  return (
    <div className="absolute contents left-[706px] top-[723px]">
      <p className="absolute font-['SF_Compact_Rounded:Bold',sans-serif] h-[23px] leading-[1.5] left-[706px] not-italic text-[18px] text-[rgba(255,255,255,0.97)] top-[723px] w-[54px]">Login</p>
    </div>
  );
}

function ClientProfilingDashboard() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.97)] h-[1024px] left-0 overflow-clip top-0 w-[1341px]" data-name="CLIENT PROFILING DASHBOARD">
      <Group />
      <div className="absolute bg-[rgba(255,255,255,0.97)] h-[1246px] left-[-36px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] top-[10px] w-[343px]" />
      <div className="absolute bg-[rgba(255,255,255,0.97)] h-[105px] left-[307px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] top-0 w-[1034px]" />
      <div className="absolute h-[900px] left-[319px] top-[122px] w-[929px]" data-name="image 51 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage511} />
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents left-0 top-0">
      <ClientProfilingDashboard />
    </div>
  );
}

export default function MainDashboard() {
  return (
    <div className="relative size-full" data-name="MAIN DASHBOARD">
      <Group1 />
    </div>
  );
}