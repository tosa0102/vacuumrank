
import pandas as pd, json, math, argparse, os

def load_reviews(csv_path):
  df = pd.read_csv(csv_path)
  # Drop empty ratings
  df = df[pd.to_numeric(df['rating'], errors='coerce').notnull()]
  df['rating'] = df['rating'].astype(float)
  df['count'] = pd.to_numeric(df['count'], errors='coerce').fillna(0).astype(int)
  return df

def weighted_review_score(group, weights, target=2000, min_scale=0.7, max_scale=1.0):
  # group has rows per retailer for one brand+model
  if group.empty: return None
  # convert 1-5 to 0-10
  group = group.copy()
  group['rating10'] = group['rating'] * 2.0
  group['w'] = group['retailer'].map(weights).fillna(0.7)
  # Weighted average of rating10 using log-weight on counts
  group['count_w'] = (group['count']+1).apply(lambda n: math.log1p(n))
  if group['count_w'].sum() == 0:
    base = group['rating10'].mean()
  else:
    base = (group['rating10'] * group['count_w']).sum() / group['count_w'].sum()
  # Confidence scale by total counts
  total_c = group['count'].sum()
  conf = min(1.0, math.log10(total_c+1) / math.log10(target+1))
  scale = min_scale + (max_scale - min_scale) * conf
  return round(base * scale, 2)

def recalc_band(json_in, reviews_df, weights, target, min_scale, max_scale, out_json):
  with open(json_in, 'r', encoding='utf-8') as f:
    data = json.load(f)
  # compute per model
  results = {}
  for (brand, model), g in reviews_df.groupby(['brand','model']):
    results[(brand, model)] = weighted_review_score(g, weights, target, min_scale, max_scale)
  # update
  for item in data:
    key = (item['brand'], item['model'])
    rs = results.get(key)
    item['review_score'] = rs
    # overall: 50% spec + 40% review + 10% value (if review exists), else 60/40
    if rs is not None:
      item['overall'] = round(0.50*item['spec'] + 0.40*rs + 0.10*item['value'], 2)
    else:
      item['overall'] = round(0.60*item['spec'] + 0.40*item['value'], 2)
  # sort by overall desc
  data.sort(key=lambda x: x.get('overall',0), reverse=True)
  with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--band", choices=["performance","budget"], required=True)
  ap.add_argument("--json_in", required=True)
  ap.add_argument("--reviews_csv", required=True)
  ap.add_argument("--weights_json", required=True)
  ap.add_argument("--out_json", required=True)
  args = ap.parse_args()

  with open(args.weights_json, 'r', encoding='utf-8') as f:
    weights_conf = json.load(f)
  weights = weights_conf['weights']
  target = weights_conf['confidence']['target_count']
  min_scale = weights_conf['confidence']['min_scale']
  max_scale = weights_conf['confidence']['max_scale']

  reviews_df = load_reviews(args.reviews_csv)
  recalc_band(args.json_in, reviews_df, weights, target, min_scale, max_scale, args.out_json)

if __name__ == "__main__":
  main()
