import { API_CONFIG } from '../config/env';
import { AnalyticsData, DateRange } from '../types/analytics';

export const fetchAnalytics = async (
  courierName: string,
  dateRange: DateRange
): Promise<AnalyticsData> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api:uEBBwbSs/delikaquickshipper_orders_table`,
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    const orders = await response.json();
    const filteredOrders = orders.filter(
      (order: any) => 
        order.courierName === courierName &&
        new Date(order.date) >= new Date(dateRange.startDate) &&
        new Date(order.date) <= new Date(dateRange.endDate)
    );

    return calculateAnalytics(filteredOrders);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

const calculateAnalytics = (orders: any[]): AnalyticsData => {
  const successfulDeliveries = orders.filter(
    order => order.status === 'Delivered'
  ).length;
  const failedDeliveries = orders.filter(
    order => order.status === 'DeliveryFailed'
  ).length;

  const totalEarnings = orders.reduce(
    (sum, order) => sum + (order.amount || 0),
    0
  );

  // Calculate average delivery time (assuming there's a deliveryTime field)
  const deliveryTimes = orders
    .filter(order => order.deliveryTime)
    .map(order => order.deliveryTime);
  const averageDeliveryTime = deliveryTimes.length
    ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
    : 0;

  return {
    totalEarnings,
    totalOrders: orders.length,
    totalHours: Math.round(orders.length * 0.5), // Assuming average 30 mins per delivery
    successfulDeliveries,
    failedDeliveries,
    averageDeliveryTime,
    date: new Date().toISOString(),
  };
}; 