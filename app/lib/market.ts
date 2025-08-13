export function getMarketFromHost(host?: string): 'uk' | 'us' | 'se' {
  const h = (host || '').toLowerCase();
  if (h.endsWith('.co.uk')) return 'uk';
  if (h.endsWith('.com')) return 'us';
  if (h.endsWith('.se')) return 'se';
  return 'uk';
}
export function currencyCode(m: 'uk'|'us'|'se'){ return m==='uk'?'GBP':m==='us'?'USD':'SEK'; }
