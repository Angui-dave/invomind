/** Reports — re-exports derived selectors (no hardcoded aggregates) */

export {
  revenueByMonth as revenueSeries,
  monthRevenue,
  topClients,
  type RevenuePoint,
  type TopClientRevenue,
} from "@/lib/data/derive";
