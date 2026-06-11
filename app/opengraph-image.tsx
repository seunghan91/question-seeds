import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "질문씨앗 · Question Seeds — 질문 하나가 생각의 깊이를 바꿉니다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LEVELS = [
  { n: 1, name: "기억", color: "#a8a29e" },
  { n: 2, name: "이해", color: "#0ea5e9" },
  { n: 3, name: "적용", color: "#10b981" },
  { n: 4, name: "분석", color: "#8b5cf6" },
  { n: 5, name: "평가·창조", color: "#f59e0b" },
];

// 폰트 글리프는 assets/NotoSansKR-Bold-subset.ttf 서브셋에 포함된 문자만 렌더 가능.
// 문구를 바꾸면 서브셋을 재생성할 것 (글리프 누락 = 두부).
export default async function Image() {
  const notoKr = await readFile(
    join(process.cwd(), "assets/NotoSansKR-Bold-subset.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f7f6f2",
          fontFamily: "NotoSansKR",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 96 }}>🌱</span>
          <span style={{ fontSize: 96, fontWeight: 700, color: "#1d2024" }}>
            질문씨앗
          </span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 36,
            color: "#5a6470",
          }}
        >
          질문 하나가 생각의 깊이를 바꿉니다
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: 24,
            color: "#8a857a",
          }}
        >
          Question Seeds · Korean AI Question Coach
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 56 }}>
          {LEVELS.map((l) => (
            <div
              key={l.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "#ffffff",
                border: "2px solid #e3dfd5",
                borderRadius: 9999,
                padding: "12px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  backgroundColor: l.color,
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {l.n}
              </div>
              <span style={{ fontSize: 24, color: "#1d2024", fontWeight: 700 }}>
                {l.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NotoSansKR", data: notoKr, style: "normal", weight: 700 },
      ],
    }
  );
}
