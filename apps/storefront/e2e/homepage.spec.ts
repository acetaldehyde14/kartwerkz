import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders the hero headline, CTAs, and the 3D canvas mounts', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'MAKE IT YOURS.' })).toBeVisible();
    await expect(
      page.getByText('Custom kart graphics. Built around your identity.').first(),
    ).toBeVisible();

    // The R3F canvas is dynamically imported client-side — give it a moment
    // to mount rather than asserting on first paint. Next.js dev mode
    // compiles each route on first request, which can take well past the
    // default timeout the first time this route is hit.
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  });

  test('"DESIGN YOUR KIT" navigates to the configurator', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'DESIGN YOUR KIT' }).click();
    await expect(page).toHaveURL(/\/configurator$/);
  });

  test('"EXPLORE GRAPHICS" navigates to the gallery', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'EXPLORE GRAPHICS' }).click();
    await expect(page).toHaveURL(/\/gallery$/);
  });
});
