export type ReturnRecord = { month: string; [ticker: string]: number | string | null }
export type CommonRange = { start: string; end: string }

export function getCommonRange(instruments: { firstReturnMonth: string | null; lastReturnMonth: string | null }[]): CommonRange | null {
  if (!instruments.length || instruments.some((item) => !item.firstReturnMonth || !item.lastReturnMonth)) return null
  const start = instruments.reduce((latest, item) => item.firstReturnMonth! > latest ? item.firstReturnMonth! : latest, '')
  const end = instruments.reduce((earliest, item) => item.lastReturnMonth! < earliest ? item.lastReturnMonth! : earliest, '9999-99')
  return start <= end ? { start, end } : null
}

export function filterCompleteReturns(rows: ReturnRecord[], tickers: string[], start: string, end: string): ReturnRecord[] {
  if (!tickers.length || start > end) return []
  return rows.filter((row) => row.month >= start && row.month <= end && tickers.every((ticker) => typeof row[ticker] === 'number' && Number.isFinite(row[ticker])))
}

export function simulatePortfolio(monthlyAssetReturns: number[][], targetWeights: number[], rebalanceEveryMonths: number): number[] {
  if (!monthlyAssetReturns.length || !targetWeights.length) return []
  if (monthlyAssetReturns.some((row) => row.length !== targetWeights.length)) throw new Error('Return rows and weights have different lengths')
  const totalWeight = targetWeights.reduce((sum, weight) => sum + weight, 0)
  if (targetWeights.some((weight) => weight < 0) || Math.abs(totalWeight - 1) > 1e-8) throw new Error('Weights must be nonnegative and sum to 1')
  let currentWeights = targetWeights.slice()
  return monthlyAssetReturns.map((assetReturns, index) => {
    if (rebalanceEveryMonths > 0 && index % rebalanceEveryMonths === 0) currentWeights = targetWeights.slice()
    const portfolioReturn = assetReturns.reduce((sum, assetReturn, i) => sum + currentWeights[i] * assetReturn, 0)
    const nextValue = assetReturns.map((assetReturn, i) => currentWeights[i] * (1 + assetReturn))
    const portfolioValue = nextValue.reduce((sum, value) => sum + value, 0)
    if (portfolioValue <= 0) throw new Error('Portfolio value became non-positive')
    currentWeights = nextValue.map((value) => value / portfolioValue)
    return portfolioReturn
  })
}

export function summarizePortfolio(monthlyAssetReturns: number[][], weights: number[], rebalanceEveryMonths: number) {
  const n = monthlyAssetReturns.length
  if (n < 2) return null
  const monthlyMean = weights.map((_, column) => monthlyAssetReturns.reduce((sum, row) => sum + row[column], 0) / n)
  const portfolioMean = monthlyMean.reduce((sum, mean, i) => sum + mean * weights[i], 0)
  const rebalancedReturns = simulatePortfolio(monthlyAssetReturns, weights, rebalanceEveryMonths)
  const buyHoldReturns = simulatePortfolio(monthlyAssetReturns, weights, 0)
  const realizedMean = rebalancedReturns.reduce((sum, value) => sum + value, 0) / rebalancedReturns.length
  const annualRisk = Math.sqrt(12 * rebalancedReturns.reduce((sum, value) => sum + (value - realizedMean) ** 2, 0) / Math.max(rebalancedReturns.length - 1, 1))
  const cagr = (returns: number[]) => {
    const growth = returns.reduce((value, rate) => value * (1 + rate), 1)
    return growth > 0 ? Math.pow(growth, 12 / returns.length) - 1 : -1
  }
  return {
    annualMean: portfolioMean * 12,
    annualRisk,
    rebalancedCagr: cagr(rebalancedReturns),
    buyHoldCagr: cagr(buyHoldReturns),
    monthlyReturns: rebalancedReturns,
    buyHoldMonthlyReturns: buyHoldReturns,
  }
}

export function meanCovarianceAnnualized(monthlyAssetReturns: number[][]) {
  const n = monthlyAssetReturns.length
  const assets = monthlyAssetReturns[0]?.length ?? 0
  if (n < 2 || assets === 0) return null
  const monthlyMeans = Array.from({ length: assets }, (_, i) => monthlyAssetReturns.reduce((sum, row) => sum + row[i], 0) / n)
  const covariance = monthlyMeans.map((_, i) => monthlyMeans.map((_, j) => 12 * monthlyAssetReturns.reduce((sum, row) => sum + (row[i] - monthlyMeans[i]) * (row[j] - monthlyMeans[j]), 0) / (n - 1)))
  return { means: monthlyMeans.map((value) => value * 12), covariance }
}
