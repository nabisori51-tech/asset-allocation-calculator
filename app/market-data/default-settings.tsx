"use client"

import { useEffect, useMemo, useState } from "react"

export function readSavedDefault<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  } catch { return null }
}

export function SaveDefaultButton({ storageKey, value, label = "현재 설정을 기본값으로 저장" }: { storageKey: string; value: unknown; label?: string }) {
  const serialized = useMemo(() => JSON.stringify(value), [value])
  const [saved, setSaved] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  useEffect(() => { setSaved(window.localStorage.getItem(storageKey)) }, [storageKey])
  const isDefault = saved === serialized
  function save() {
    window.localStorage.setItem(storageKey, serialized)
    setSaved(serialized)
    setNotice("이 브라우저의 현재 주소에서 기본 설정으로 저장했습니다.")
  }
  return <div className="analysis-default-control"><button type="button" className="analysis-default-button" aria-pressed={isDefault} onClick={save}>{isDefault ? "현재 기본값 · 다시 저장" : label}</button><span role="status">{notice || (isDefault ? "저장된 기본 설정과 같습니다." : "")}</span></div>
}
