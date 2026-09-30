import React from 'react';
import { StripeProvider as ActualStripeProvider, useStripe as actualUseStripe } from '@stripe/stripe-react-native';

export const StripeProvider = ({ publishableKey, children, ...props }: any) => {
  if (!publishableKey || typeof publishableKey !== 'string' || !publishableKey.trim()) {
    return <>{children}</>;
  }
  try {
    return (
      <ActualStripeProvider publishableKey={publishableKey} {...props}>
        {children}
      </ActualStripeProvider>
    );
  } catch (err) {
    console.warn('StripeProvider initialization error, continuing without Stripe:', err);
    return <>{children}</>;
  }
};

export const useStripe = () => {
  try {
    return actualUseStripe();
  } catch {
    return {
      initPaymentSheet: async () => ({ error: { message: 'Stripe is not configured' } }),
      presentPaymentSheet: async () => ({ error: { message: 'Stripe is not configured' } }),
    } as any;
  }
};
