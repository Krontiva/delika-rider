import { Order } from './order';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsData {
  totalEarnings: number;
  totalOrders: number;
  totalHours: number;
  pendingDeliveries: number;
  activeDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
} 