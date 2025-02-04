import { Order, OrderStatus } from '../types/order';

interface StatusUpdateResponse {
  success: boolean;
  error?: string;
}

export class OrderStatusService {
  private static BASE_URL = 'https://api-server.krontiva.africa/api:uEBBwbSs';

  static async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    additionalData?: Record<string, any>
  ): Promise<StatusUpdateResponse> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/delikaquickshipper_orders_table/${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderStatus: status,
            ...additionalData,
            updateTime: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status'
      };
    }
  }

  static async validateOTP(orderId: string, otp: string): Promise<StatusUpdateResponse> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/validate_otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            otp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Invalid OTP');
      }

      return { success: true };
    } catch (error) {
      console.error('Error validating OTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate OTP'
      };
    }
  }
} 