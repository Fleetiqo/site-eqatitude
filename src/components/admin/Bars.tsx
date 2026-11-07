import type { CSSProperties } from "react";

export interface Bar {
  label: string;
  short?: string;
  value: number;
  color?: string;
}

/** Small dependency-free bar chart. */
export function Bars({
  data,
  color = "var(--green-2)",
  height = 140,
  labelEvery = 1,
  format = (v: number) => String(v),
}: {
  data: Bar[];
  color?: string;
  height?: number;
  labelEvery?: number;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars" style={{ "--h": `${height}px` } as CSSProperties}>
      {data.map((d, i) => (
        <div className="bars__col" key={d.label} title={`${d.label} : ${format(d.value)}`}>
          <span className="bars__val">{d.value ? format(d.value) : ""}</span>
          <span
            className="bars__bar"
            style={{ height: `${(d.value / max) * 100}%`, background: d.color ?? color }}
          ></span>
          <span className="bars__lbl">{i % labelEvery === 0 ? (d.short ?? d.label) : ""}</span>
        </div>
      ))}
    </div>
  );
}
