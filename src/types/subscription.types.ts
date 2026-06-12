export interface SubscriptionPlanRow {
  id: string;
  plan_name: string;
  plan_type: string;
  daily_token_limit: number | null;
  monthly_token_limit: number | null;
  max_messages_per_day: number | null;
  max_pdfs_per_day: number | null;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
