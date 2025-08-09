
# VacuumRank — UK starter site

This is a minimal **Next.js + Tailwind** site with:
- Country page for **UK** with three bands (Premium, Performance, Budget)
- A **Compare** widget to pick any 3 models and see spec/score deltas
- Datasets as JSON in `/data` (generated from our desk tests)
- A script to **add UK review weighting** for Performance & Budget

## 1) Run it locally
```bash
npm install
npm run dev
# open http://localhost:3000
```

## 2) Edit the data
- Premium (UK): `data/uk-premium.json` (already includes review scores)
- Performance (UK): `data/uk-performance.json`
- Budget (UK): `data/uk-budget.json`

## 3) Add review scores for Performance & Budget (UK)
Fill the CSV templates we generated for you (from Chat):
- `/mnt/data/reviews_template_uk_performance.csv`
- `/mnt/data/reviews_template_uk_budget.csv`

Each line is **brand, model, retailer, rating, count, last_seen**.
Retailers supported in weights: `amazon_uk, argos, currys, johnlewis, ao, brand_store`.

Then run (adjust paths if you move files):
```bash
python scripts/aggregate_reviews.py   --band performance   --json_in data/uk-performance.json   --reviews_csv /mnt/data/reviews_template_uk_performance.csv   --weights_json data/review-sources.json   --out_json data/uk-performance.json

python scripts/aggregate_reviews.py   --band budget   --json_in data/uk-budget.json   --reviews_csv /mnt/data/reviews_template_uk_budget.csv   --weights_json data/review-sources.json   --out_json data/uk-budget.json
```

The script computes a **ReviewScore (0–10)** using a weighted approach:
- Converts 1–5 star ratings to 0–10 scale (×2)  
- Weights by retailer quality and **log(count)** so huge counts don't dominate
- Adds a confidence scaling based on total review volume

After the script, reload the site — **rankings will update automatically**.

## 4) Deploy
The project works on **Vercel** out of the box:
- Create a new project → import from your repo → framework: Next.js → build command: `next build`
- Add a custom domain later if you want (e.g., robotbest.co)

## 5) Monthly updates
- Update street prices and availability in the JSON files.
- Append new reviews to the CSVs, re-run the script, commit & deploy.
- Consider a cron/GitHub Action to refresh prices nightly.

---

*Generated on 2025-08-09*
