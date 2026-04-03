import { NextRequest, NextResponse } from "next/server";
import { createVideoTask } from "@/lib/seedance";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function parseImageDataUrl(imageUrl: string) {
  const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);

  if (!match) {
    throw new Error("参考图片格式不正确，请重新上传");
  }

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];

  if (!SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType)) {
    throw new Error("参考图片仅支持 JPG、PNG 或 WEBP 格式");
  }

  const padding = base64Payload.endsWith("==") ? 2 : base64Payload.endsWith("=") ? 1 : 0;
  const byteLength = (base64Payload.length * 3) / 4 - padding;

  if (byteLength > MAX_IMAGE_BYTES) {
    throw new Error("参考图片不能超过 5MB");
  }
}

export async function POST(req: NextRequest) {
  const { prompt, ratio, duration, imageUrl } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "请输入故事描述" }, { status: 400 });
  if (imageUrl) {
    try {
      parseImageDataUrl(String(imageUrl));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "参考图片校验失败" },
        { status: 400 }
      );
    }
  }
  try {
    const { taskId } = await createVideoTask({ prompt, ratio, duration: Number(duration), imageUrl });
    return NextResponse.json({ taskId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
