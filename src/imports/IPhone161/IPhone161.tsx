import svgPaths from "./svg-goga8cul8s";

function Text() {
  return (
    <div className="absolute inset-[64.29%_8.12%_10.43%_11.18%]" data-name="text">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 251.784 78.887">
        <g id="text">
          <g id="Vector">
            <path d={svgPaths.pf3e6d00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p5794770} fill="var(--fill-0, white)" />
            <path d={svgPaths.p3e12c780} fill="var(--fill-0, white)" />
            <path d={svgPaths.p3455d280} fill="var(--fill-0, white)" />
            <path d={svgPaths.p3bed2e00} fill="var(--fill-0, white)" />
            <path d={svgPaths.pb62400} fill="var(--fill-0, white)" />
            <path d={svgPaths.p353f1bd0} fill="var(--fill-0, white)" />
            <path d={svgPaths.p17a4e400} fill="var(--fill-0, white)" />
            <path d={svgPaths.p31458f80} fill="var(--fill-0, white)" />
            <path d={svgPaths.p36e34300} fill="var(--fill-0, white)" />
            <path d={svgPaths.p2f4ae700} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Component() {
  return (
    <div className="absolute inset-[19.39%_17.34%_45.5%_16.5%]" data-name="27">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 206.413 109.544">
        <g id="27">
          <g id="Union">
            <path clipRule="evenodd" d={svgPaths.p2d31c880} fill="var(--fill-0, white)" fillRule="evenodd" />
            <path d={svgPaths.pd1b7680} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Ball() {
  return (
    <div className="absolute inset-[6.12%_40.11%_74.66%_38.78%]" data-name="ball">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 65.8629 59.9645">
        <g id="ball">
          <ellipse cx="32.9314" cy="29.9823" fill="var(--fill-0, #FFCB05)" id="Ellipse 2" rx="32.9314" ry="29.9823" />
          <path d={svgPaths.pacb1f0} fill="var(--fill-0, #FAA61A)" id="Intersect" />
        </g>
      </svg>
    </div>
  );
}

function Cup() {
  return (
    <div className="absolute inset-[16.66%_40.05%_42.01%_38.97%]" data-name="cup">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 65.4661 128.96">
        <g id="cup">
          <path d={svgPaths.p409a900} fill="var(--fill-0, #FFDD00)" id="cup_2" />
          <g id="Mask group">
            <mask height="129" id="mask0_28_6055" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }} width="66" x="0" y="0">
              <path d={svgPaths.p409a900} fill="var(--fill-0, #FFDD00)" id="cup_3" />
            </mask>
            <g mask="url(#mask0_28_6055)">
              <g id="Group 5">
                <path d={svgPaths.p18ecf8c0} fill="var(--fill-0, #FDB913)" id="shadow" />
                <rect fill="var(--fill-0, #00DDFF)" height="13.7268" id="band" width="54.7534" x="5.75313" y="101.867" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[6.12%_40.05%_42.01%_38.78%]">
      <Ball />
      <Cup />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[6.12%_8.12%_10.43%_11.18%]">
      <Text />
      <Component />
      <Group />
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[16px] items-start left-1/2 p-[10px] top-[693px] w-[371px]">
      <div className="bg-[#0df] relative rounded-[12px] shrink-0 w-full" data-name="Button">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex items-center justify-center px-[16px] py-[10px] relative size-full">
            <div className="flex flex-col font-['Barlow:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#090f1e] text-[18px] text-center whitespace-nowrap">
              <p className="leading-[normal]">Create account</p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative rounded-[12px] shrink-0 w-full" data-name="Button">
        <div aria-hidden="true" className="absolute border border-[#0df] border-solid inset-0 pointer-events-none rounded-[12px]" />
        <div className="flex flex-row items-center justify-center size-full">
          <div className="content-stretch flex items-center justify-center px-[16px] py-[10px] relative size-full">
            <div className="flex flex-col font-['Barlow:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0df] text-[18px] text-center whitespace-nowrap">
              <p className="leading-[normal]">Log in</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IPhone() {
  return (
    <div className="bg-[#090f1e] relative size-full" data-name="iPhone 16 - 1">
      <div className="absolute bg-[#090f1f] left-[41px] overflow-clip rounded-[8px] size-[312px] top-[172px]" data-name="Logo">
        <Group1 />
      </div>
      <Frame />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Barlow:Medium',sans-serif] h-[114px] justify-center leading-[0] left-[196.5px] not-italic text-[16px] text-center text-white top-[586px] tracking-[2.56px] w-[245px]">
        <p className="leading-[24px]">CONNECTING 2026 COLLECTORS TO TRADE PANINI STICKERS</p>
      </div>
    </div>
  );
}