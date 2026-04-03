import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RICCILAB";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-2px",
            display: "flex",
          }}
        >
          RICCILAB
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.4)",
            marginTop: 16,
            letterSpacing: "4px",
            display: "flex",
          }}
        >
          EXPERIMENTS IN CODE, SYSTEMS, AND INTERFACES
        </div>

        {/* Terminal decoration */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 60,
            fontSize: 14,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "2px",
            display: "flex",
          }}
        >
          riccilab.dev
        </div>
      </div>
    ),
    { ...size }
  );
}
