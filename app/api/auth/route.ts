import { createHmac, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

const COOKIE = "allocation_access"
const MAX_AGE = 60 * 60 * 24 * 14

function signature(secret: string, expires: string) {
  return createHmac("sha256", secret).update(`allocation:${expires}`).digest("hex")
}

export async function POST(request: NextRequest) {
  const secret = process.env.CALCULATOR_PASSWORD
  if (!secret) return NextResponse.json({ error: "비밀번호 설정이 완료되지 않았습니다." }, { status: 503 })

  let password = ""
  try {
    const body = await request.json()
    password = typeof body.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 })
  }
  const expected = Buffer.from(secret)
  const provided = Buffer.from(password)
  const valid = expected.length === provided.length && timingSafeEqual(expected, provided)
  if (!valid) return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 })

  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE, `${expires}.${signature(secret, expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 })
  return response
}
