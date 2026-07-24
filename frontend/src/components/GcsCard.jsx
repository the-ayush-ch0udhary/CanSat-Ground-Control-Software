import React from "react";
import { cn } from "@/lib/utils";

export function GcsCard({ title, icon: Icon, children, className, active, right, testId }) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "gcs-card relative flex flex-col overflow-hidden",
        active && "gcs-card-active",
        className
      )}
    >
      {(title || right) && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2 text-cyan-300/90">
            {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
            <span className="font-orbitron text-[11px] tracking-[0.18em] uppercase">
              {title}
            </span>
          </div>
          {right}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export default GcsCard;
