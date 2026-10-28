import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          // Royal Amethyst lockup on jet black — matches the in-app wordmark.
          background: "linear-gradient(135deg, #3B0A6B 0%, #9333EA 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "20px",
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        +
      </div>
    ),
    { ...size }
  );
}
