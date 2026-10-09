import { expect, test } from '@playwright/test';

/**
 * The golden path from AGENTS.md: configurator → add to cart → checkout →
 * test-mode payment → order confirmation. Requires the API + a seeded
 * Postgres to be running and reachable (see docs/deployment.md / the
 * `e2e` job in .github/workflows/ci.yml) and `STRIPE_SECRET_KEY` unset so
 * the dev payment adapter's `/checkout/dev-confirm` stand-in is used —
 * this suite does not and must never exercise real Stripe.
 */
test.describe('Golden path: configure → cart → checkout → confirmation', () => {
  test('configuring a kit, adding it to cart, and completing a dev-mode checkout produces a paid order', async ({
    page,
  }) => {
    await page.goto('/configurator');

    // Kart tab is active by default — select the first real kart model
    // returned by the API (seeded as "<Manufacturer> — <Model> Demo Chassis").
    const firstKartModel = page.getByRole('button', { name: /Demo Chassis/ }).first();
    await expect(firstKartModel).toBeVisible({ timeout: 15_000 });
    await firstKartModel.click();
    await expect(firstKartModel.getByText('Selected')).toBeVisible();

    // Design tab — select the first seeded demo design.
    await page.getByRole('tab', { name: 'Design' }).click();
    const firstDesign = page.getByRole('button', { name: /Demo/ }).first();
    await expect(firstDesign).toBeVisible({ timeout: 15_000 });
    await firstDesign.click();

    // Driver tab — set a race number (part of the persisted configuration).
    await page.getByRole('tab', { name: 'Driver' }).click();
    await page.getByLabel('Race Number').fill('23');

    // Add to cart — this calls POST /configurations then POST /cart/items
    // for real, then redirects to /cart on success.
    await page.getByRole('button', { name: 'ADD TO CART' }).click();
    await expect(page).toHaveURL(/\/cart$/, { timeout: 30_000 });
    await expect(page.getByText('CUSTOM KART GRAPHICS KIT')).toBeVisible();
    // Intl.NumberFormat renders a non-breaking space between the currency
    // code and amount — \s matches that too, a literal space would not.
    await expect(page.getByText(/^SGD\s/).first()).toBeVisible();

    // Checkout — contact + shipping form, then redirect to the hosted (or
    // dev-adapter) checkout page.
    await page.getByRole('link', { name: 'PROCEED TO CHECKOUT' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await page.getByLabel('Email').fill('e2e@example.com');
    await page.getByLabel('Full Name').fill('E2E Test');
    await page.getByLabel('Address Line 1').fill('1 Test Way');
    await page.getByLabel('City').fill('Singapore');
    await page.getByLabel('Postal Code').fill('123456');
    await page.getByRole('button', { name: 'PAY SECURELY' }).click();

    // Dev adapter: checkoutUrl -> /checkout/dev-confirm, which calls
    // POST /checkout/dev-confirm/:orderId and redirects to /checkout/success.
    await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'ORDER CONFIRMED' })).toBeVisible();
  });
});
