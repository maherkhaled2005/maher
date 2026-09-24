import React from 'react';
export const StripeProvider = ({ children }: any) => <>{children}</>;
export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: { message: 'Web payment requires @stripe/stripe-js instead. Please use the mobile app to test.' } }),
  presentPaymentSheet: async () => ({ error: { message: 'Web payment requires @stripe/stripe-js instead. Please use the mobile app to test.' } })
});
