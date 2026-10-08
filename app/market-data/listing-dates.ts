export type ListingDateInfo = { date: string; source: string }

// ETF launch/listing dates come from issuer product pages; BRK-B uses its first trading date.
export const listingDates: Record<string, ListingDateInfo> = {
  "SPY": { date: "1993-01-22", source: "https://www.ssga.com/us/en/individual/etfs/state-street-spdr-sp-500-etf-trust-spy" },
  "QQQ": { date: "1999-03-10", source: "https://www.invesco.com/content/dam/invesco/hk/en/pdf/factsheet/Invesco_QQQ_factsheet_EN.pdf" },
  "IWM": { date: "2000-05-22", source: "https://www.ishares.com/us/products/239710/ishares-russell-2000-etf" },
  "VEA": { date: "2007-07-20", source: "https://fund-docs.vanguard.com/F0936.pdf" },
  "VWO": { date: "2005-03-04", source: "https://investor.vanguard.com/investment-products/etfs/profile/vwo" },
  "SGOV": { date: "2020-05-26", source: "https://www.ishares.com/us/products/314116/sgov" },
  "SHY": { date: "2002-07-22", source: "https://www.ishares.com/us/products/239452/ishares-1-3-year-treasury-bond-etf" },
  "IEF": { date: "2002-07-22", source: "https://www.blackrock.com/us/individual/literature/fact-sheet/ief-ishares-7-10-year-treasury-bond-etf-fund-fact-sheet-en-us.pdf" },
  "TLT": { date: "2002-07-22", source: "https://www.blackrock.com/us/financial-professionals/products/239454/ishares-20-year-treasury-bond-etf" },
  "AGG": { date: "2003-09-22", source: "https://www.ishares.com/us/products/239458/ishares-core-total-us-bond-market-etf" },
  "LQD": { date: "2002-07-22", source: "https://www.ishares.com/us/products/239566/ishares-iboxx-investment-grade-corporate-bond-etf" },
  "HYG": { date: "2007-04-04", source: "https://www.ishares.com/us/products/239565/ishares-iboxx-high-yield-corporate-bond-etf" },
  "TIP": { date: "2003-12-04", source: "https://www.ishares.com/us/products/239467/ishares-tips-bond-etf" },
  "VNQ": { date: "2004-09-23", source: "https://fund-docs.vanguard.com/F0986.pdf" },
  "GLD": { date: "2004-11-18", source: "https://www.ssga.com/us/en/intermediary/etfs/spdr-gold-shares-gld" },
  "COPX": { date: "2010-04-19", source: "https://www.globalxetfs.com/funds/copx" },
  "BRK-B": { date: "1996-05-09", source: "https://www.statmuse.com/money/ask/when-did-berkshire-hathaway-go-public" },
}

export function formatListingDate(ticker: string) {
  const date = listingDates[ticker]?.date
  return date ? date.replaceAll("-", ".") : "확인 필요"
}
