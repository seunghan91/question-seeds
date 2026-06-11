/**
 * 한국어 질문 레벨 분류 정확도 평가
 *
 * 사용법:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/eval.ts            # Claude
 *   LLM_PROVIDER=openai OPENAI_API_KEY=... npx tsx scripts/eval.ts  # GPT 비교
 *   LLM_PROVIDER=mock npx tsx scripts/eval.ts                # 휴리스틱 베이스라인
 *
 * 출력: 정확도, ±1 레벨 허용 정확도, 혼동행렬. 결과는 data/eval-results/에 저장.
 */
import fs from "node:fs";
import path from "node:path";
import { evaluateQuestion } from "../lib/evaluate";

type Item = { id: number; level: number; question: string };

async function main() {
  const dataPath = path.join(__dirname, "..", "data", "evalset.ko.json");
  const { items } = JSON.parse(fs.readFileSync(dataPath, "utf8")) as {
    items: Item[];
  };

  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  console.log(`provider=${provider}, items=${items.length}\n`);

  const confusion: number[][] = Array.from({ length: 6 }, () =>
    Array(6).fill(0)
  );
  const results: Array<Item & { predicted: number; correct: boolean }> = [];
  let exact = 0;
  let within1 = 0;

  for (const item of items) {
    const evaluation = await evaluateQuestion(item.question);
    const predicted = evaluation.level;
    const correct = predicted === item.level;
    if (correct) exact++;
    if (Math.abs(predicted - item.level) <= 1) within1++;
    confusion[item.level][predicted]++;
    results.push({ ...item, predicted, correct });
    process.stdout.write(
      `#${String(item.id).padStart(2)} expected=${item.level} predicted=${predicted} ${correct ? "✓" : "✗"}  ${item.question.slice(0, 40)}\n`
    );
  }

  const n = items.length;
  console.log(`\n정확도(exact): ${exact}/${n} = ${((exact / n) * 100).toFixed(1)}%`);
  console.log(`정확도(±1):   ${within1}/${n} = ${((within1 / n) * 100).toFixed(1)}%`);

  console.log("\n혼동행렬 (행=정답, 열=예측):");
  console.log("      P1  P2  P3  P4  P5");
  for (let g = 1; g <= 5; g++) {
    console.log(
      `  L${g}  ` + confusion[g].slice(1).map((c) => String(c).padStart(2)).join("  ")
    );
  }

  const outDir = path.join(__dirname, "..", "data", "eval-results");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath = path.join(outDir, `${provider}-${stamp}.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        provider,
        model:
          provider === "openai"
            ? process.env.OPENAI_MODEL ?? "gpt-4o-mini"
            : process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        exact_accuracy: exact / n,
        within1_accuracy: within1 / n,
        confusion,
        results,
      },
      null,
      2
    )
  );
  console.log(`\n저장: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
