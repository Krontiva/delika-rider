export type OrderStatus = 
  | "ReadyForPickup"
  | "Assigned"
  | "Pickup"
  | "OnTheWay"
  | "Delivered"
  | "Cancelled"
  | "DeliveryFailed"
  | "Completed";

interface LocationPoint {
  fromLatitude: number;
  fromLongitude: number;
  fromAddress: string;
}

interface DropOffPoint {
  toLatitude: number;
  toLongitude: number;
  toAddress: string;
}

export interface Order {
  id: string;
  created_at: string;
  restaurantId: string;
  branchId: string;
  pickup: LocationPoint[];
  dropOff: DropOffPoint[];
  customerName: string;
  customerPhoneNumber: string;
  orderNumber: number;
  courierName: string;
  courierPhoneNumber: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  orderDate: string | null;
  deliveryPrice: number;
  orderPrice: string;
  totalPrice: string;
  paymentStatus: string;
  products?: {
    name: string;
    quantity: number;
    price: number;
  }[];
  assignedTime?: string;
  deliveryTime?: string;
  orderReceivedTime?: string;
  orderCompletedTime?: string;
  batchID: string | null;
} 
