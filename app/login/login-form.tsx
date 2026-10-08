"use client"

import { FormEvent, useState } from "react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || "접속할 수 없습니다. 비밀번호를 확인해 주세요.")
        return
      }
      window.location.replace("/")
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-eyebrow">ETF PORTFOLIO CONSTRUCTION</div>
        <h1>자산배분 계산기</h1>
        <p>계속하려면 공유받은 비밀번호를 입력해 주세요.</p>
        <label htmlFor="shared-password">비밀번호</label>
        <input id="shared-password" name="password" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <div role="alert" className="login-error">{error}</div>}
        <button type="submit" disabled={busy}>{busy ? "확인 중…" : "계산기 열기"}</button>
      </form>
    </main>
  )
}
