import { NextRequest, NextResponse } from "next/server";
import { evaluateQuestion } from "@/lib/evaluate";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "question_required" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "question_too_long" }, { status: 400 });
  }

  try {
    const evaluation = await evaluateQuestion(question);
    return NextResponse.json(evaluation);
  } catch (e) {
    console.error("evaluate failed:", e);
    return NextResponse.json({ error: "evaluation_failed" }, { status: 502 });
  }
}
