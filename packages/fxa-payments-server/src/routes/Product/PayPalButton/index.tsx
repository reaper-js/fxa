import React from 'react';
import ReactDOM from 'react-dom';

import { useCallback } from 'react';

declare var paypal: {
  Buttons: {
    driver: Function;
  };
};

const PaypalButtonBase = paypal.Buttons.driver('react', {
  React,
  ReactDOM,
});

export const PaypalButton = () => {
  const createOrder = useCallback((data: any, actions: any) => {
    console.log('CANARY', 'createOrder', data, actions);
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: '0.01',
          },
        },
      ],
    });
  }, []);
  const onApprove = useCallback((data: any, actions: any) => {
    console.log('CANARY', 'onApprove', data, actions);
    return actions.order.capture();
  }, []);

  // POST to the fxa-auth-server to create a new Stripe customer from Stripe if one doesn’t exist.
  //   - TODO: Above may already happen; verify
  // POST to fxa-auth-server to get a checkout token from PayPal
  //   - Route: "/oauth/subscription/paypal-checkout"

  return (
    <PaypalButtonBase
      data-testid="paypal-button"
      createOrder={createOrder}
      onApprove={onApprove}
    />
  );
};

export default PaypalButton;
