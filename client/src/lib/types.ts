export interface Account { id: number; name: string; type: string; category: string; subtype: string | null; sys_key: string | null; phone: string | null; notes: string | null; active: number; balance: number; last_activity: string | null; entries: number }
export interface Kpis { avgWeight: number | null; fcr: number | null; cfcr: number | null; livability: number | null; mortality: number | null; costPerBird: number | null; costPerKg: number | null; salePerBird: number | null; profitPerBird: number | null; profitPerKg: number | null; meanAge: number | null; bpi: number | null }
export interface BatchSummary {
  id: number; farm_id: number; farm_name: string; farmer_name: string | null; batch_no: number; placement_date: string | null; placed_qty: number | null;
  status: 'running' | 'closed'; closed_date: string | null; notes: string | null; partial: number; ageDays: number | null;
  cost: number; salesAmount: number; profit: number; soldBirds: number; soldKg: number; feedBags: number; wipBalance: number; firstSale: string | null; lastSale: string | null; kpis: Kpis;
}
export interface CostLine { amount: number; qty: number }
export interface SalesLine { id: number; date: string; category: string; trader: string | null; billNo: number | null; voucherId: number; birds: number; kg: number; rate: number | null; amount: number; avgWeight: number | null }
export interface BatchDetail extends BatchSummary {
  costs: { chicks: CostLine; feed: CostLine; feed_return: CostLine; medicine: CostLine; integration: CostLine; misc: CostLine; opening: CostLine };
  salesLines: SalesLine[]; bySupplier: { party: string | null; category: string; amount: number }[];
}
export interface Farm {
  id: number; name: string; farmer_name: string | null; farmer_account_id: number | null; farmer_account: string | null; phone: string | null; location: string | null; capacity: number | null; active: number; notes: string | null;
  batchCount: number; running: { id: number; batch_no: number; ageDays: number | null; placed_qty: number | null; cost: number } | null;
  lifetime: { profit: number; profitPerKg: number | null; avgFcr: number | null };
}
export interface VoucherRow { id: number; voucher_no: number; type: string; date: string; description: string; bill_no: number | null; source: string; party_id: number | null; party_name: string | null; farm_id: number | null; farm_name: string | null; batch_id: number | null; batch_no: number | null; amount: number }
export interface VoucherDetail extends VoucherRow { meta: any; entries: { id: number; account_id: number; account_name: string; account_category: string; farm_name: string | null; debit: number; credit: number; category: string | null; item: string | null; qty: number | null; weight: number | null; rate: number | null; narration: string | null }[] }
export interface Settings { company_name: string; company_place: string; tagline: string; address: string; phones: string; gstin: string; feed_bag_kg: string; integration_rate_per_kg: string; integration_rate_per_bird_broast: string; harvest_alert_days: string; feed_types: string[]; next_bill_no: string }
