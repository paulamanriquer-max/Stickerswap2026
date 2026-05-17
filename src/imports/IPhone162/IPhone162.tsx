import svgPaths from "./svg-u7n0uc64yi";

function Text() {
  return (
    <div className="absolute inset-[64.29%_8.12%_10.43%_11.18%]" data-name="text">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 79.0859 24.7786">
        <g id="text">
          <g id="Vector">
            <path d={svgPaths.p2fd17d40} fill="var(--fill-0, white)" />
            <path d={svgPaths.p2417b00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p2cf20c00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p293af580} fill="var(--fill-0, white)" />
            <path d={svgPaths.p2782ed00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p4cd980} fill="var(--fill-0, white)" />
            <path d={svgPaths.p1d595000} fill="var(--fill-0, white)" />
            <path d={svgPaths.p28ce5180} fill="var(--fill-0, white)" />
            <path d={svgPaths.p3135f900} fill="var(--fill-0, white)" />
            <path d={svgPaths.p21e4dd00} fill="var(--fill-0, white)" />
            <path d={svgPaths.p372def00} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Component() {
  return (
    <div className="absolute inset-[19.39%_17.34%_45.5%_16.5%]" data-name="27">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64.835 34.4082">
        <g id="27">
          <g id="Union">
            <path clipRule="evenodd" d={svgPaths.pdf17800} fill="var(--fill-0, white)" fillRule="evenodd" />
            <path d={svgPaths.p166b1800} fill="var(--fill-0, white)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Ball() {
  return (
    <div className="absolute inset-[6.12%_40.11%_74.66%_38.78%]" data-name="ball">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.6877 18.835">
        <g id="ball">
          <ellipse cx="10.3438" cy="9.4175" fill="var(--fill-0, #FFCB05)" id="Ellipse 2" rx="10.3438" ry="9.4175" />
          <path d={svgPaths.p27b88800} fill="var(--fill-0, #FAA61A)" id="Intersect" />
        </g>
      </svg>
    </div>
  );
}

function Cup() {
  return (
    <div className="absolute inset-[16.66%_40.05%_42.01%_38.97%]" data-name="cup">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.5631 40.5066">
        <g id="cup">
          <path d={svgPaths.p2aba6800} fill="var(--fill-0, #FFDD00)" id="cup_2" />
          <g id="Mask group">
            <mask height="41" id="mask0_28_6035" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }} width="21" x="0" y="0">
              <path d={svgPaths.p2aba6800} fill="var(--fill-0, #FFDD00)" id="cup_3" />
            </mask>
            <g mask="url(#mask0_28_6035)">
              <g id="Group 5">
                <path d={svgPaths.p1c2ccff0} fill="var(--fill-0, #FDB913)" id="shadow" />
                <rect fill="var(--fill-0, #00DDFF)" height="4.31163" id="band" width="17.1982" x="1.80707" y="31.9968" />
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

function Button() {
  return (
    <div className="bg-[#fff838] content-stretch flex gap-[4px] items-center justify-center pl-[8px] pr-[12px] py-[4px] relative rounded-[100px] shrink-0" data-name="Button">
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Map pin">
        <div className="absolute inset-[4.17%_12.5%]" data-name="Icon">
          <div className="absolute inset-[-5.45%_-6.67%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.6 16.2667">
              <g id="Icon">
                <path d={svgPaths.p364bf500} stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                <path d={svgPaths.p91bfc80} stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col font-['Barlow:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#090f1e] text-[16px] text-center whitespace-nowrap">
        <p className="leading-[normal]">Kansas City</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0">
      <div className="flex flex-col font-['Barlow:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-white tracking-[2.56px] w-[245px]">
        <p className="leading-[24px]">CONNECTING 2026 COLLECTORS TO TRADE PANINI STICKERS</p>
      </div>
      <Button />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[14px] items-center left-[29.5px] top-0 w-[312px]">
      <div className="bg-[#090f1f] h-[312px] overflow-clip relative rounded-[8px] shrink-0 w-full" data-name="Logo">
        <Group1 />
      </div>
      <Frame3 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col gap-[16px] items-start left-0 p-[10px] w-[371px]">
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

function Frame2() {
  return (
    <div className="absolute bottom-[39px] left-[11px] top-[114px] w-[371px]">
      <Frame1 />
      <Frame />
    </div>
  );
}

export default function IPhone() {
  return (
    <div className="bg-[#090f1e] content-stretch flex flex-col items-center pb-[39px] pt-[114px] px-[11px] relative size-full" data-name="iPhone 16 - 2">
      <Frame2 />
    </div>
  );
}