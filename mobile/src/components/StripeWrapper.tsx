import { StripeProvider as ActualStripeProvider, useStripe as actualUseStripe } from '@stripe/stripe-react-native';
export const StripeProvider = ActualStripeProvider;
export const useStripe = actualUseStripe;
