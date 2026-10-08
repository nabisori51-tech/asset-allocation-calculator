import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "자산배분 계산기",
  description: "ETF 자산배분과 리밸런싱 시나리오를 비교하는 계산기",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>
}
