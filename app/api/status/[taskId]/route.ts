import { NextRequest, NextResponse } from "next/server";
import { getTaskStatus } from "@/lib/seedance";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const task = await getTaskStatus(params.taskId);
    return NextResponse.json(task, {
      headers: { "Cache-Control": "no-store, no-cache" }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
