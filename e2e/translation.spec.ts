import { test, expect } from '@playwright/test';

test.describe('Agent Semantic Aligner', () => {
    test('homepage loads with correct title', async ({ page }) => {
        await page.goto('/');

        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        await expect(page.locator('h1')).toContainText('Agent Semantic Aligner');
        await expect(page.getByText(/Translation middleware/i)).toBeVisible();
    });

    test('translation form is visible and interactive', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check form elements exist using more resilient selectors
        const sourceVocabInput = page.locator('input').first();
        const messageTextarea = page.locator('textarea');
        const translateButton = page.getByRole('button', { name: /Translate/i });

        await expect(sourceVocabInput).toBeVisible();
        await expect(messageTextarea).toBeVisible();
        await expect(translateButton).toBeVisible();

        // Button should be disabled when textarea is empty
        await expect(translateButton).toBeDisabled();

        // Fill in the form
        await messageTextarea.fill('Patient diagnosed with hypertension');

        // Button should now be enabled
        await expect(translateButton).toBeEnabled();
    });

    test('shows loading state during translation', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Mock the API to delay response
        await page.route('/api/translate', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    originalMessage: 'Patient diagnosed with hypertension',
                    translatedMessage: 'Patient diagnosed with high blood pressure',
                    mappingsUsed: [],
                    newMappingsCreated: [{ sourceTerm: 'hypertension', targetTerm: 'high blood pressure', confidence: 0.95 }],
                    overallConfidence: 0.95,
                }),
            });
        });

        const messageTextarea = page.locator('textarea');
        const translateButton = page.getByRole('button', { name: /Translate/i });

        await messageTextarea.fill('Patient diagnosed with hypertension');
        await translateButton.click();

        // Should show loading state
        await expect(page.getByText(/Translating/i)).toBeVisible();

        // Wait for result
        await expect(page.getByText(/high blood pressure/i)).toBeVisible({ timeout: 10000 });
    });

    test('displays translation result with mappings', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Mock the API response
        await page.route('/api/translate', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    originalMessage: 'Patient has tachycardia',
                    translatedMessage: 'Patient has fast heart rate',
                    mappingsUsed: [],
                    newMappingsCreated: [{ sourceTerm: 'tachycardia', targetTerm: 'fast heart rate', confidence: 0.9 }],
                    overallConfidence: 0.9,
                }),
            });
        });

        const messageTextarea = page.locator('textarea');
        const translateButton = page.getByRole('button', { name: /Translate/i });

        await messageTextarea.fill('Patient has tachycardia');
        await translateButton.click();

        // Check translated message appears
        await expect(page.getByText('fast heart rate')).toBeVisible({ timeout: 10000 });

        // Check confidence is shown
        await expect(page.getByText(/90\.0%/)).toBeVisible();

        // Check new mapping is shown
        await expect(page.getByText(/New Mappings Learned/i)).toBeVisible();
    });

    test('handles API errors gracefully', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Mock API failure
        await page.route('/api/translate', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Translation failed' }),
            });
        });

        const messageTextarea = page.locator('textarea');
        const translateButton = page.getByRole('button', { name: /Translate/i });

        await messageTextarea.fill('Test message');
        await translateButton.click();

        // Should show error message
        await expect(page.getByText(/Translation failed|error/i)).toBeVisible({ timeout: 10000 });
    });
});
