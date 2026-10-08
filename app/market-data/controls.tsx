"use client"

import { formatListingDate, listingDates } from "./listing-dates"

export type MarketInstrument = {
  ticker: string
  provider_symbol: string
  instrument_type: string
  asset_class: string
  issuer_or_company: string
  notes: string
  firstReturnMonth: string | null
  lastReturnMonth: string | null
  monthlyReturnObservations: number
  name: string
  label: string
}

export const REBALANCE_OPTIONS = [
  { months: 1, label: "월" },
  { months: 3, label: "분기" },
  { months: 6, label: "반기" },
  { months: 12, label: "년" },
] as const

export function instrumentTitle(item: MarketInstrument) {
  return `${item.ticker} · ${item.asset_class}${item.instrument_type === "Common stock" ? " · 개별주" : ""}`
}

export function instrumentGroup(item: MarketInstrument) {
  const value = item.asset_class.toLowerCase()
  if (value.includes("real estate") || value.includes("reit")) return "부동산"
  if (value.includes("gold") || value.includes("commodity") || value.includes("metal")) return "원자재"
  if (item.instrument_type === "Common stock" || /equity|equities|stock|growth|mining/.test(value)) return "주식"
  if (value.includes("treasury") || value.includes("bond") || value.includes("bill")) return "채권"
  return "기타"
}

export function InstrumentPicker({ instruments, selected, onChange, className, legend = "분석할 종목 선택" }: {
  instruments: MarketInstrument[]
  selected: string[]
  onChange: (ticker: string) => void
  className: string
  legend?: string
}) {
  const order = ["주식", "채권", "원자재", "부동산", "기타"]
  const groups = order.map((group) => ({ group, items: instruments.filter((item) => instrumentGroup(item) === group) })).filter((entry) => entry.items.length)
  return <fieldset className={className}>
    <legend>{legend}</legend>
    <div className={`${className}-list`}>
      {groups.map(({ group, items }) => <section className="instrument-picker-group" key={group} aria-label={`${group} 종목`}><h3>{group}<span>{items.length}</span></h3><div className="instrument-picker-group-items">{items.map((item) => <label key={item.ticker} title={item.notes}>
        <input type="checkbox" checked={selected.includes(item.ticker)} onChange={() => onChange(item.ticker)} />
        <span><strong>{item.ticker}</strong><small>{item.asset_class}{item.instrument_type === "Common stock" ? " · 개별주" : ""}</small><small className="instrument-listing-date" title={listingDates[item.ticker] ? `상장일 출처: ${listingDates[item.ticker].source}` : "상장일 출처 없음"}>상장일 {formatListingDate(item.ticker)}</small></span>
      </label>)}</div></section>)}
    </div>
  </fieldset>
}

export function RebalanceSelect({ value, onChange, className, id }: {
  value: number
  onChange: (months: number) => void
  className: string
  id: string
}) {
  return <div className={className}>
    <label htmlFor={id}>리밸런싱</label>
    <select id={id} aria-label="리밸런싱 주기" value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {REBALANCE_OPTIONS.map((option) => <option key={option.months} value={option.months}>{option.label} 리밸런싱</option>)}
    </select>
  </div>
}

export function MonthRangeControls({ start, end, min, max, count, onStart, onEnd, className, prefix }: {
  start: string
  end: string
  min: string
  max: string
  count: number
  onStart: (month: string) => void
  onEnd: (month: string) => void
  className: string
  prefix: string
}) {
  return <div className={className}>
    <label htmlFor={`${prefix}-start`}>시작 월</label>
    <input id={`${prefix}-start`} aria-label="시작 월" type="month" min={min} max={end || max} value={start} disabled={!min} onChange={(event) => onStart(event.target.value)} />
    <span>~</span>
    <label htmlFor={`${prefix}-end`}>종료 월</label>
    <input id={`${prefix}-end`} aria-label="종료 월" type="month" min={start || min} max={max} value={end} disabled={!max} onChange={(event) => onEnd(event.target.value)} />
    <strong>{start || "—"}–{end || "—"} · {count}개월</strong>
  </div>
}
