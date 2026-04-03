"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface CyberChartProps {
  dataString?: string;
  className?: string;
  type?: "linear" | "monotone" | "stepBefore" | "stepAfter";
  yScale?: "linear" | "log";
}

// System/Cybernetic specific neon colors
const NEON_COLORS = ["#33cc77", "#ff9900", "#00eeff", "#ff00ea", "#eaff00"];

export function CyberChart({ dataString, className = "", type = "linear", yScale = "linear" }: CyberChartProps) {
  const chartData = useMemo(() => {
    if (!dataString) return [];
    try {
      return JSON.parse(dataString);
    } catch {
      return [];
    }
  }, [dataString]);

  if (chartData.length === 0) {
    return (
      <div className="p-6 my-10 border border-border bg-black/50 text-red-500 font-mono text-sm tracking-widest rounded-lg">
        [SYS_ERROR] Invalid Data Format. JSON payload expected.
      </div>
    );
  }

  // Extract keys for lines (ignoring typical 'X' axis fields)
  const xKey = Object.keys(chartData[0]).find(k => ["step", "time", "date", "x"].includes(k.toLowerCase())) || Object.keys(chartData[0])[0];
  const lineKeys = Object.keys(chartData[0]).filter(k => k !== xKey);

  return (
    <div className={`my-12 p-6 pb-2 border border-border bg-bg/50 rounded-lg relative overflow-hidden backdrop-blur-sm ${className}`}>
      {/* Cybernetic HUD Accents */}
      <div className="absolute top-0 left-0 w-10 h-[2px] bg-accent/60" />
      <div className="absolute top-0 left-0 w-[2px] h-10 bg-accent/60" />
      <div className="absolute bottom-0 right-0 w-10 h-[2px] bg-accent/60" />
      <div className="absolute bottom-0 right-0 w-[2px] h-10 bg-accent/60" />
      
      <div className="flex justify-between items-end mb-6 pl-4 border-l-2 border-accent/40">
        <div className="font-mono text-sm tracking-widest text-black dark:text-white/90">
          DATA_VISUALIZATION <span className="text-accent animate-pulse">_</span>
        </div>
        <div className="font-mono text-[10px] tracking-wider text-muted hidden sm:block">
          RECHARTS_ENGINE / REALTIME
        </div>
      </div>

      <div className="h-[350px] sm:h-[450px] w-full font-mono text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: yScale === "log" ? 10 : -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="opacity-10 dark:opacity-20 text-black dark:text-white" vertical={false} />
            <XAxis 
              dataKey={xKey} 
              stroke="var(--color-muted)" 
              tick={{ fill: "var(--color-muted)", fontSize: 11 }} 
              tickLine={false} 
              axisLine={{ stroke: "var(--color-border)" }} 
              tickMargin={15}
            />
            <YAxis
              stroke="var(--color-muted)"
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              tickMargin={15}
              {...(yScale === "log" ? {
                scale: "log",
                domain: ["auto", "auto"],
                allowDataOverflow: true,
                tickFormatter: (v: number) => {
                  if (v <= 0) return "";
                  const exp = Math.log10(v);
                  if (Number.isInteger(Math.round(exp * 100) / 100)) return `10^${Math.round(exp)}`;
                  return v.toExponential(0);
                },
              } : {})}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "var(--color-bg)", 
                border: "1px solid var(--color-border)", 
                borderRadius: "2px",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
              }}
              itemStyle={{ color: "var(--color-black)" }}
              labelStyle={{ color: "var(--color-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}
              cursor={{ stroke: "var(--color-accent)", strokeWidth: 1, strokeDasharray: "2 2" }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px", fontSize: "11px", letterSpacing: "0.1em" }} 
              iconType="circle"
            />
            {lineKeys.map((key, i) => (
              <Line 
                key={key}
                type={type} 
                dataKey={key} 
                stroke={NEON_COLORS[i % NEON_COLORS.length]} 
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 5, 
                  fill: "var(--color-bg)", 
                  stroke: NEON_COLORS[i % NEON_COLORS.length], 
                  strokeWidth: 2 
                }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute bottom-3 left-6 font-mono text-[9px] text-muted tracking-widest opacity-40">
        SYS.DATAVIEW_MODULE V1.0
      </div>
    </div>
  );
}
