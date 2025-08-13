export type Band = 'premium' | 'performance' | 'budget';
export type Scores = { spec: number; review?: number; value: number; overall: number; prevRank?: number };
export type Retailer = { name: string; url: string };
export type Product = {
  id: string; name: string; band: Band;
  price_gbp?: number; price?: number;
  base?: string; navigation?: string; suction_pa?: number; mop_type?: string;
  scores: Scores; image?: string; affiliate_retailers?: Retailer[];
};

export async function getProducts(market: 'uk'|'us'|'se'): Promise<Product[]> {
  try {
    const mod = await import(`@/data/${market}/robot-vacuums.json`);
    return (mod.default ?? []) as Product[];
  } catch {
    // fallback till äldre datafiler (om de finns kvar)
    try {
      const [prem, perf, bud] = await Promise.all([
        import(`@/data/${market}-premium.json`).then(m => (m.default ?? []).map((x:any)=>({...x, band:'premium'}))),
        import(`@/data/${market}-performance.json`).then(m => (m.default ?? []).map((x:any)=>({...x, band:'performance'}))),
        import(`@/data/${market}-budget.json`).then(m => (m.default ?? []).map((x:any)=>({...x, band:'budget'}))),
      ]);
      return ([] as Product[]).concat(prem, perf, bud);
    } catch {
      return [];
    }
  }
}
