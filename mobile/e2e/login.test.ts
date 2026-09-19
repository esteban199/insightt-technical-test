import { describe, it, beforeAll, expect } from '@jest/globals';

describe('Login flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('shows the login screen on launch', async () => {
    await expect(element(by.text('Welcome back'))).toBeVisible();
  });

  it('navigates to the register screen and back', async () => {
    await element(by.text('Sign Up')).tap();
    await expect(element(by.text('Create account'))).toBeVisible();

    await element(by.text('Sign In')).tap();
    await expect(element(by.text('Welcome back'))).toBeVisible();
  });
});
