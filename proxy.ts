import { createHmac, timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

const COOKIE = "allocation_access"

function isValid(value: string, secret: string) {
  const [expires, supplied] = value.split(".")
  if (!expires || !supplied || Number(expires) <= Math.floor(Date.now() / 1000)) return false
  const expected = createHmac("sha256", secret).update(`allocation:${expires}`).digest("hex")
  const a = Buffer.from(expected)
  const b = Buffer.from(supplied)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) return NextResponse.next()

  const secret = process.env.CALCULATOR_PASSWORD
  const token = request.cookies.get(COOKIE)?.value ?? ""
  if (secret && isValid(token, secret)) return NextResponse.next()

  const login = request.nextUrl.clone()
  login.pathname = "/login"
  login.search = ""
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
