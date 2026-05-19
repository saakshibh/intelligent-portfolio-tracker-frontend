export interface StockPrediction {
  id: string;
  asset: string;          // e.g., "TCS.NS"
  score: number;          // e.g., 0.65
  label: string;          // e.g., "Positive"
  predicted_price: number; // e.g., 2457.79
  created_at: string;
}