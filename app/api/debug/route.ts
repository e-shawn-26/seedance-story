import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.SEEDANCE_API_KEY || "not-set";
  const masked = key.length > 8 ? key.slice(0,4) + "..." + key.slice(-4) : key;
  // Also test calling the real API to confirm auth
  const testRes = await fetch("https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/cgt-20260403170915-sjl8m", {
    headers: { Authorization: `Bearer ${key}` }
  });
  const testData = await testRes.json();
  return NextResponse.json({ 
    keyMasked: masked, 
    keyLength: key.length,
    apiStatus: testRes.status,
    taskStatus: testData.status
  });
}
