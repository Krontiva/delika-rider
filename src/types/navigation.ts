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
  };
  OrderDropoffScreen: {
    order: Order;
  };
  OrderCompleteScreen: {
    order: Order;
  };
  OrderSuccess: {
    order: Order;
  };
  OrderReceipt: {
    order: Order;
  };
  Settings: undefined;
  AccountInformation: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 