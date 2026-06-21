import { test, expect } from '@playwright/test';

test('loads the app and shows the activate camera button', async ({ page }) => {
  await page.goto('/');

  // Verify the information heading is present
  await expect(page.getByRole('heading', { name: 'Information' })).toBeVisible();
  
  // Verify the Activate Camera button is visible and enabled
  const activateBtn = page.getByRole('button', { name: 'Activate Camera' });
  await expect(activateBtn).toBeVisible();
  await expect(activateBtn).toBeEnabled();
});

test('clicking Activate Camera starts camera flow', async ({ page }) => {
  await page.goto('/');

  const activateBtn = page.getByRole('button', { name: 'Activate Camera' });
  await activateBtn.click();

  // Once clicked, the button should be removed (replaced by canvas and actions)
  await expect(activateBtn).not.toBeVisible();
});

