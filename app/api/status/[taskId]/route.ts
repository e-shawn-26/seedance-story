import { NextRequest, NextResponse } from "next/server";
import { getTaskStatus } from "@/lib/seedance";

export async function GET(_: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const task = await getTaskStatus(params.taskId);
    return NextResponse.json(task);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
