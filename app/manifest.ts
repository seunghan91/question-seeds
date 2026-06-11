import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "질문씨앗 · Question Seeds",
    short_name: "질문씨앗",
    description:
      "질문을 Bloom 분류 Level 1~5로 평가하고 한 단계 깊은 질문으로 코칭하는 한국어 질문 코치",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#f7f6f2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
