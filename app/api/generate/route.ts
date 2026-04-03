import { NextRequest, NextResponse } from "next/server";
import { createVideoTask } from "@/lib/seedance";

export async function POST(req: NextRequest) {
  const { prompt, ratio, duration, imageUrl } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "请输入故事描述" }, { status: 400 });
  try {
    const { taskId } = await createVideoTask({ prompt, ratio, duration: Number(duration), imageUrl });
    return NextResponse.json({ taskId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
