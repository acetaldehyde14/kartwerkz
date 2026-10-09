import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './common/s3/s3.module';
import { AuditModule } from './modules/audit/audit.module';
import { QueueModule } from './modules/queues/queue.module';
import { SessionContextMiddleware } from './common/middleware/session-context.middleware';
import { GuestSessionMiddleware } from './common/middleware/guest-session.middleware';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { KartCatalogModule } from './modules/kart-catalog/kart-catalog.module';
import { GraphicsDesignsModule } from './modules/graphics-designs/graphics-designs.module';
import { ConfigurationsModule } from './modules/configurations/configurations.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { CartModule } from './modules/cart/cart.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ArtworkModule } from './modules/artwork/artwork.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    PrismaModule,
    S3Module,
    AuditModule,
    QueueModule,
    HealthModule,
    AuthModule,
    CustomersModule,
    ProductsModule,
    KartCatalogModule,
    GraphicsDesignsModule,
    ConfigurationsModule,
    UploadsModule,
    CartModule,
    PricingModule,
    CheckoutModule,
    OrdersModule,
    WebhooksModule,
    ArtworkModule,
    SuppliersModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Order matters: session context (optional auth) runs before the guest
    // session guarantee, so handlers can see both an authenticated user and
    // a guest session id on the same request if both cookies happen to be
    // present (e.g. right after login, before the guest cookie expires).
    consumer.apply(SessionContextMiddleware, GuestSessionMiddleware).forRoutes('*');
  }
}
