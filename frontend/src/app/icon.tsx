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
          borderRadius: "16px",
          // Amethyst glow on jet black with a lilac mark, as in the app.
          background: "radial-gradient(circle at 35% 30%, #6420A8 0%, #3B0A6B 55%, #050505 100%)",
          border: "1px solid #C7A8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F4EFFA",
          fontSize: "20px",
          fontWeight: 300,
          fontFamily: "sans-serif",
        }}
      >
        +
      </div>
    ),
    { ...size }
  );
}
