"use client"

import { useEffect, useMemo, useState } from "react"
import marketData from "../market-data/etf-data.json"
import { filterCompleteReturns, getCommonRange, summarizePortfolio, type ReturnRecord } from "../market-data/analysis"
import { InstrumentPicker, MonthRangeControls, RebalanceSelect, type MarketInstrument } from "../market-data/controls"
import { placeEndpointLabels } from "./endpoint-labels"
import { readSavedDefault, SaveDefaultButton } from "../market-data/default-settings"
import "../dashboard/dashboard.css"
import "./allocator.css"
import "../market-data/market-calculators.css"
import "./allocator-markers.css"

type CurvePoint = { weight: number; risk: number; cagr: number }
type ActiveMix = CurvePoint & { ticker: string; assetLabel: string; color: string }
const instruments = marketData.instruments as MarketInstrument[]
const rows = marketData.returns as ReturnRecord[]
const starterTickers = ["SPY", "IWM", "IEF", "TLT", "GLD", "VNQ"]
const starterRange = getCommonRange(instruments.filter((item) => starterTickers.includes(item.ticker)))!
const palette = ["#2563eb", "#d97706", "#059669", "#9333ea", "#dc2626", "#0891b2", "#64748b", "#be123c", "#4f46e5", "#0f766e", "#c2410c", "#7c3aed", "#15803d", "#0369a1", "#a21caf", "#b45309", "#475569"]
const fmt = (value: number) => `${(value * 100).toFixed(2)}%`

export default function AllocatorCalculator({ embedded = false }: { embedded?: boolean }) {
  const [selected, setSelected] = useState(starterTickers)
  const [benchmark, setBenchmark] = useState("SPY")
  const [startMonth, setStartMonth] = useState(starterRange.start)
  const [endMonth, setEndMonth] = useState(starterRange.end)
  const [rebalanceMonths, setRebalanceMonths] = useState(1)
  const [activeMix, setActiveMix] = useState<ActiveMix | null>(null)
  const [axisRefresh, setAxisRefresh] = useState(0)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const saved = readSavedDefault<{ selected: string[]; benchmark: string; startMonth: string; endMonth: string; rebalanceMonths: number }>("portfolio-default-allocator")
    if (!saved || !Array.isArray(saved.selected)) return
    const next = [...new Set(saved.selected)].filter(ticker => instruments.some(item => item.ticker === ticker))
    if (next.length < 2) return
    const range = getCommonRange(instruments.filter(item => next.includes(item.ticker)))
    if (!range) return
    const benchmarkNext = next.includes(saved.benchmark) ? saved.benchmark : next[0]
    setSelected(next); setBenchmark(benchmarkNext)
    setStartMonth(saved.startMonth >= range.start && saved.startMonth <= range.end ? saved.startMonth : range.start)
    setEndMonth(saved.endMonth >= range.start && saved.endMonth <= range.end ? saved.endMonth : range.end)
    if ([1, 3, 6, 12].includes(saved.rebalanceMonths)) setRebalanceMonths(saved.rebalanceMonths)
  }, [])
  const defaultSettings = { selected, benchmark, startMonth, endMonth, rebalanceMonths }
  const chosenAssets = useMemo(() => instruments.filter((item) => selected.includes(item.ticker)), [selected])
  const commonRange = useMemo(() => getCommonRange(chosenAssets), [chosenAssets])
  const periodRows = useMemo(() => commonRange && startMonth && endMonth ? filterCompleteReturns(rows, selected, startMonth, endMonth) : [], [commonRange, selected, startMonth, endMonth])
  const comparisonAssets = useMemo(() => chosenAssets.filter((asset) => asset.ticker !== benchmark), [chosenAssets, benchmark])
  const series = useMemo(() => comparisonAssets.map((asset, index) => {
    const points: CurvePoint[] = []
    for (let step = 0; step <= 20; step++) {
      const weight = step / 20
      const monthly = periodRows.map((row) => [row[benchmark] as number, row[asset.ticker] as number])
      const result = summarizePortfolio(monthly, [1 - weight, weight], rebalanceMonths)
      if (result) points.push({ weight, risk: result.annualRisk, cagr: result.rebalancedCagr })
    }
    const soloReturns = periodRows.map((row) => [row[asset.ticker] as number])
    const pure = summarizePortfolio(soloReturns, [1], rebalanceMonths)
    return { ...asset, color: palette[index % palette.length], points, pure }
  }), [comparisonAssets, periodRows, benchmark, rebalanceMonths])
  const benchmarkStats = useMemo(() => {
    const values = periodRows.map((row) => [row[benchmark] as number])
    return summarizePortfolio(values, [1], rebalanceMonths)
  }, [periodRows, benchmark, rebalanceMonths])
  const dataExtents = useMemo(() => {
    const values = series.flatMap((item) => item.points)
    if (!values.length) return { minX: 0, maxX: 0.3, minY: 0, maxY: 0.2 }
    const xs = values.map((point) => point.risk)
    const ys = values.map((point) => point.cagr)
    const rangeX = Math.max(...xs) - Math.min(...xs)
    const rangeY = Math.max(...ys) - Math.min(...ys)
    const padX = Math.max(rangeX * 0.12, 0.005)
    const padY = Math.max(rangeY * 0.18, 0.003)
    return { minX: Math.min(...xs) - padX, maxX: Math.max(...xs) + padX, minY: Math.min(...ys) - padY, maxY: Math.max(...ys) + padY }
  }, [series])
  const extents = useMemo(() => {
    const centerX = (dataExtents.minX + dataExtents.maxX) / 2
    const centerY = (dataExtents.minY + dataExtents.maxY) / 2
    const halfX = (dataExtents.maxX - dataExtents.minX) / (2 * zoom)
    const halfY = (dataExtents.maxY - dataExtents.minY) / (2 * zoom)
    return { minX: centerX - halfX, maxX: centerX + halfX, minY: centerY - halfY, maxY: centerY + halfY }
  }, [dataExtents, zoom, axisRefresh])
  useEffect(() => { setZoom(1) }, [series])
  const width = 840, height = 430, left = 74, right = 24, top = 24, bottom = 62
  const x = (value: number) => left + (value - extents.minX) / (extents.maxX - extents.minX || 1) * (width - left - right)
  const y = (value: number) => height - bottom - (value - extents.minY) / (extents.maxY - extents.minY || 1) * (height - top - bottom)
  const ticks = (min: number, max: number) => Array.from({ length: 5 }, (_, i) => min + (max - min) * i / 4)
  const endpointSources = [
    ...(series[0]?.points[0] ? [{ ticker: benchmark, point: series[0].points[0], color: series[0].color }] : []),
    ...series.flatMap((item) => {
      const point = item.points.find((candidate) => candidate.weight === 1)
      return point ? [{ ticker: item.ticker, point, color: item.color }] : []
    }),
  ]
  const visibleEndpointSources = endpointSources.filter(({ point }) => {
    const pointX = x(point.risk), pointY = y(point.cagr)
    return pointX >= left && pointX <= width - right && pointY >= top && pointY <= height - bottom
  })
  const endpointCurves = series.map((item) => item.points.map((point) => ({ x: x(point.risk), y: y(point.cagr) })))
  const endpointLabels = placeEndpointLabels(visibleEndpointSources.map((item) => ({
    ...item,
    x: x(item.point.risk),
    y: y(item.point.cagr),
    labelWidth: item.ticker.length * 7 + 36,
  })), endpointCurves, { left: left + 2, right: width - right - 2, top: top + 2, bottom: height - bottom - 2 })

  function toggleAsset(ticker: string) {
    const next = selected.includes(ticker) ? selected.filter((item) => item !== ticker) : [...selected, ticker]
    const nextBenchmark = next.includes(benchmark) ? benchmark : next[0] ?? ""
    const range = getCommonRange(instruments.filter((item) => next.includes(item.ticker)))
    setSelected(next); setBenchmark(nextBenchmark); setActiveMix(null)
    if (range) { setStartMonth(range.start); setEndMonth(range.end) } else { setStartMonth(""); setEndMonth("") }
  }
  function changeStart(value: string) { setStartMonth(value); if (endMonth && value > endMonth) setEndMonth(value); setActiveMix(null) }
  function changeEnd(value: string) { setEndMonth(value); if (startMonth && value < startMonth) setStartMonth(value); setActiveMix(null) }
  function selectBenchmark(value: string) { setBenchmark(value); setActiveMix(null) }

  const calculator = <section className={`allocator-content${embedded ? " allocator-content-embedded" : ""}`}>
    <header className="allocator-header"><div><p className="allocator-eyebrow">ETF PORTFOLIO CONSTRUCTION</p><h1>자산배분 계산기</h1><p>기준 ETF와 다른 ETF를 혼합해 과거 위험·복리수익률을 비교합니다.</p></div></header>
    <section className="allocator-controls" aria-label="계산 조건">
      <MonthRangeControls start={startMonth} end={endMonth} min={commonRange?.start ?? ""} max={commonRange?.end ?? ""} count={periodRows.length} onStart={changeStart} onEnd={changeEnd} className="allocator-period" prefix="allocator" />
      <div className="allocator-benchmark"><label htmlFor="allocator-benchmark">기준 ETF</label><select id="allocator-benchmark" aria-label="기준 ETF" value={benchmark} onChange={(event) => selectBenchmark(event.target.value)}>{chosenAssets.map((asset) => <option key={asset.ticker} value={asset.ticker}>{asset.ticker} · {asset.asset_class}</option>)}</select><span>색 연결선은 각 곡선의 100% 끝점과 종목 라벨을 잇습니다.</span></div>
      <RebalanceSelect value={rebalanceMonths} onChange={(value) => { setRebalanceMonths(value); setActiveMix(null) }} className="allocator-rebalance" id="allocator-rebalance" />
      <InstrumentPicker instruments={instruments} selected={selected} onChange={toggleAsset} className="allocator-asset-picker" legend="분석할 ETF·종목 선택" />
      <small className="etf-control-note">선택 종목이 모두 보유한 가장 긴 공통 기간을 자동 적용합니다. 기간은 직접 조정할 수 있습니다. BRK-B는 ETF가 아닌 개별주입니다.</small>
      <SaveDefaultButton storageKey="portfolio-default-allocator" value={defaultSettings} />
    </section>
    <section className="allocator-chart-card" aria-label="위험과 연환산 수익률 그래프"><header><div><h2>위험–수익률 곡선</h2><p>가로축: 연환산 표준편차 · 세로축: 연환산 CAGR · 축은 선택된 곡선 범위에 맞춰 확대됩니다.</p></div><div className="allocator-chart-tools"><span className="allocator-chart-period">{startMonth}–{endMonth} · {periodRows.length}개월</span><div className="allocator-zoom-controls"><button type="button" className="allocator-axis-reset" aria-label="위험-수익률 그래프 축소" title="현재 중심에서 축소" onClick={() => setZoom((value) => Math.max(1, value / 1.2))}>−</button><span className="allocator-zoom-level" aria-live="polite">{Math.round(zoom * 100)}%</span><button type="button" className="allocator-axis-reset" aria-label="위험-수익률 그래프 확대" title="현재 중심에서 확대" onClick={() => setZoom((value) => Math.min(6, value * 1.2))}>＋</button><button type="button" className="allocator-axis-reset allocator-fit-reset" aria-label="축 범위를 현재 곡선에 맞춤" title="선택한 곡선이 보이도록 축을 다시 맞춥니다" onClick={() => { setActiveMix(null); setZoom(1); setAxisRefresh((value) => value + 1) }}>곡선에 맞춤</button></div></div></header>
      {series.length ? <div className="allocator-chart-scroll"><svg key={axisRefresh} className="allocator-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${startMonth}부터 ${endMonth}까지 ETF 혼합 포트폴리오의 위험과 CAGR`}>
        <defs><clipPath id="allocator-plot-clip"><rect x={left} y={top} width={width-left-right} height={height-top-bottom}/></clipPath></defs>
        {ticks(extents.minY, extents.maxY).map((tick, index) => <g key={`y-${index}`}><line x1={left} x2={width-right} y1={y(tick)} y2={y(tick)} className="allocator-gridline"/><text x={left-10} y={y(tick)+4} textAnchor="end" className="allocator-tick">{fmt(tick)}</text></g>)}
        {ticks(extents.minX, extents.maxX).map((tick, index) => <g key={`x-${index}`}><line y1={top} y2={height-bottom} x1={x(tick)} x2={x(tick)} className="allocator-gridline"/><text x={x(tick)} y={height-bottom+23} textAnchor="middle" className="allocator-tick">{fmt(tick)}</text></g>)}
        <line x1={left} x2={width-right} y1={height-bottom} y2={height-bottom} className="allocator-axis"/><line x1={left} x2={left} y1={top} y2={height-bottom} className="allocator-axis"/>
        <g clipPath="url(#allocator-plot-clip)">{series.map((item) => <g key={item.ticker}>
          <polyline fill="none" stroke={item.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={item.points.map((point) => `${x(point.risk)},${y(point.cagr)}`).join(" ")}/>
          {item.points.map((point) => <circle key={point.weight} className="allocator-point" cx={x(point.risk)} cy={y(point.cagr)} r={point.weight === 0 || point.weight === 1 ? 5.5 : 4.5} fill={item.color} tabIndex={0} role="button" aria-label={`${benchmark} ${Math.round((1-point.weight)*100)}%, ${item.ticker} ${Math.round(point.weight*100)}%, CAGR ${fmt(point.cagr)}, 연환산 표준편차 ${fmt(point.risk)}`} onMouseEnter={() => setActiveMix({ ...point, ticker: item.ticker, assetLabel: item.ticker, color: item.color })} onFocus={() => setActiveMix({ ...point, ticker: item.ticker, assetLabel: item.ticker, color: item.color })} onClick={() => setActiveMix({ ...point, ticker: item.ticker, assetLabel: item.ticker, color: item.color })}/>)}
        </g>)}
        {series[0]?.points[0] && <circle className="allocator-benchmark-point" cx={x(series[0].points[0].risk)} cy={y(series[0].points[0].cagr)} r="7" fill={series[0].color} pointerEvents="none"/>}</g>
        {endpointLabels.map(({ ticker, point, color, labelY, labelX, textAnchor, leaderX }) => <g key={`endpoint-label-${ticker}`} className="allocator-endpoint-callout" pointerEvents="none"><path className="allocator-endpoint-leader" stroke={color} d={`M ${x(point.risk)} ${y(point.cagr)} L ${leaderX} ${labelY}`}/><text className="allocator-endpoint-label" x={labelX} y={labelY+4} textAnchor={textAnchor} fill={color}>{ticker}</text></g>)}
        <text x={(left+width-right)/2} y={height-12} textAnchor="middle" className="allocator-axis-label">연환산 표준편차 (위험)</text><text x="18" y={(top+height-bottom)/2} textAnchor="middle" transform={`rotate(-90 18 ${(top+height-bottom)/2})`} className="allocator-axis-label">연환산 수익률 (CAGR)</text>
      </svg></div> : <p className="allocator-empty">기준 ETF와 비교 ETF를 포함해 두 종목 이상 선택하고, 최소 2개월의 자료를 지정하세요.</p>}
      <div className="allocator-mix-readout" aria-live="polite">{activeMix ? <><span className="allocator-mix-dot" style={{ backgroundColor: activeMix.color }}/><strong>혼합 비중</strong><span>{benchmark} <b>{Math.round((1-activeMix.weight)*100)}%</b></span><span>+</span><span>{activeMix.ticker} <b>{Math.round(activeMix.weight*100)}%</b></span><span className="allocator-mix-stats">CAGR {fmt(activeMix.cagr)} · 표준편차 {fmt(activeMix.risk)}</span></> : <span>그래프의 점에 마우스를 올리거나 키보드로 이동하면 종목별 혼합 비중을 확인할 수 있습니다.</span>}</div>
      <div className="allocator-legend">{series.map((item) => <span key={item.ticker}><i style={{ backgroundColor: item.color }}/>{benchmark} + {item.ticker}<small>{item.ticker}</small></span>)}{series.length > 0 && <span className="allocator-benchmark-key"><i style={{ backgroundColor: series[0].color }}/>{benchmark} (공통 끝점)</span>}</div>
    </section>
    <section className="allocator-results"><h2>선택 종목의 단독 성과</h2><p>{startMonth}–{endMonth} · {periodRows.length}개월 · 월별 총수익률 기준</p><div className="allocator-results-scroll"><table><thead><tr><th>종목</th><th>연환산 CAGR</th><th>연환산 표준편차</th><th>분석 기간</th></tr></thead><tbody>{chosenAssets.map((asset) => { const result = asset.ticker === benchmark ? benchmarkStats : series.find((item) => item.ticker === asset.ticker)?.pure; return <tr key={asset.ticker}><th scope="row">{asset.ticker} <small>{asset.asset_class}{asset.instrument_type === "Common stock" ? " · 개별주" : ""}</small></th><td>{result ? fmt(result.rebalancedCagr) : "—"}</td><td>{result ? fmt(result.annualRisk) : "—"}</td><td>{startMonth}–{endMonth}</td></tr> })}</tbody></table></div></section>
    <aside className="allocator-method"><strong>계산 기준</strong><p>월별 조정종가 수익률로 계산하며, 선택 주기마다 목표 비중으로 리밸런싱합니다. CAGR은 분배금 재투자 효과를 반영한 과거 수익률입니다. 세금·거래비용은 제외하며 과거 성과는 미래를 보장하지 않습니다.</p></aside>
  </section>
  return embedded ? calculator : <main className="dashboard-shell">{calculator}</main>
}
