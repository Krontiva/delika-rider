import { Order } from './order';

type OTPLoginScreenParams = {
    email: string;
};

export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  OTPLogin: OTPLoginScreenParams;
  MainTabs: undefined;
  Orders: undefined;
  OrderDetailsScreen: {
    order: Order;
  };
  OrderStartScreen: {
    order: Order;
    batchedOrders?: Order[];
    currentBatchIndex?: number;
  };
  OrderDropoffScreen: {
    order: Order;
    batchedOrders?: Order[];
    currentBatchIndex?: number;
  };
  OrderCompleteScreen: {
    order: Order;
    batchedOrders?: Order[];
    currentBatchIndex?: number;
  };
  OrderSuccess: {
    order: Order;
    batchedOrders?: Order[];
  };
  OrderReceipt: {
    order: Order;
  };
  Settings: undefined;
  AccountInformation: undefined;
  Terms: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 