import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PricingModule } from '../pricing/pricing.module';
import { OrdersModule } from '../orders/orders.module';
import { PAYMENT_PROVIDER } from './payment-provider.interface';
import { StripePaymentAdapter } from './stripe-payment.adapter';
import { DevPaymentAdapter } from './dev-payment.adapter';

@Module({
  imports: [PricingModule, OrdersModule],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    StripePaymentAdapter,
    DevPaymentAdapter,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (
        config: ConfigService,
        stripeAdapter: StripePaymentAdapter,
        devAdapter: DevPaymentAdapter,
      ) => {
        const hasStripeKey = Boolean(config.get<string>('STRIPE_SECRET_KEY'));
        if (!hasStripeKey && config.get<string>('NODE_ENV') === 'production') {
          throw new Error(
            'STRIPE_SECRET_KEY is required in production — refusing to fall back to DevPaymentAdapter.',
          );
        }
        if (!hasStripeKey) {
          new Logger('CheckoutModule').warn(
            'STRIPE_SECRET_KEY not set — using DevPaymentAdapter. Checkout payments are simulated, not real.',
          );
        }
        return hasStripeKey ? stripeAdapter : devAdapter;
      },
      inject: [ConfigService, StripePaymentAdapter, DevPaymentAdapter],
    },
  ],
  exports: [CheckoutService, PAYMENT_PROVIDER],
})
export class CheckoutModule {}
