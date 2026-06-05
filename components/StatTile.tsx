import clsx from "clsx";
import { Sparkline } from "./Sparkline";

type Props = {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: string;
  deltaSign?: "up" | "down" | "neutral";
  spark?: number[];
  sparkColor?: string;
  className?: string;
};

export function StatTile({
  label,
  value,
  suffix,
  delta,
  deltaSign,
  spark,
  sparkColor = "#207CFF",
  className,
}: Props) {
  return (
    <div className={clsx("tile min-h-[148px]", className)}>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            {label}
          </span>
          {delta && (
            <span
              className={clsx(
                "font-mono text-[10px] font-medium tabular",
                deltaSign === "up" && "text-accent",
                deltaSign === "down" && "text-live",
                deltaSign === "neutral" && "text-text-muted"
              )}
            >
              {delta}
            </span>
          )}
        </div>
        <div className="mt-5 bignum text-[40px]">
          {value}
          {suffix && (
            <span className="ml-1.5 text-base font-medium text-text-secondary">{suffix}</span>
          )}
        </div>
      </div>
      {spark && (
        <div className="absolute inset-x-0 bottom-0 z-0 opacity-80">
          <Sparkline data={spark} color={sparkColor} height={52} />
        </div>
      )}
    </div>
  );
}
