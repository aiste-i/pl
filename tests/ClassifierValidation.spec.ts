import { test, expect } from './baseFixture';
import { FailureClass } from '../src/webmutator/utils/FailureClassifier';
import { OracleSafety } from '../src/webmutator/utils/OracleSafety';

test.describe('Final Benchmark Corrections Validation', () => {
    
    test.describe('Instrumentation Enforcement', () => {
        test('should use structured path when using wrapped locators', async ({ page, locators, benchmarkResult }) => {
            await page.goto('/');
            await locators.addTodo().fill('Test');
            expect(benchmarkResult.instrumentationPathUsed).toBe('structured');
        });

        test('should use fallback/mixed path when bypassing wrappers', async ({ page, benchmarkResult }) => {
            await page.goto('/');
            try {
                await page.locator('#nonexistent').click({ timeout: 100 });
            } catch (e) {}
            expect(benchmarkResult.instrumentationPathUsed).not.toBe('structured');
        });
    });

    test.describe('Oracle Safety Policy', () => {
        test('OracleSafety should protect direct oracle nodes', async ({ page }) => {
            await page.setContent('<div data-testid="target">Oracle</div>');
            const isProtected = await OracleSafety.isProtected(page.locator('[data-testid="target"]'));
            expect(isProtected).toBe(true);
        });

        test('OracleSafety should protect ancestors of oracle nodes', async ({ page }) => {
            await page.setContent('<div id="ancestor"><span data-testid="child">Oracle</span></div>');
            const isProtected = await OracleSafety.isProtected(page.locator('#ancestor'));
            expect(isProtected).toBe(true);
        });
    });

    test.describe('Failure Taxonomy Determinism', () => {
        test('NO_MATCH: probe findings', async ({ page, locators, benchmarkResult }) => {
            await page.setContent('<div>No Input</div>');
            try {
                await locators.addTodo().fill('Milk', { timeout: 100 });
            } catch (e) {}
            expect(benchmarkResult.failureClass).toBe(FailureClass.NO_MATCH);
            expect(benchmarkResult.evidence.preActionResolutionObservation).toBe(0);
        });

        test('ACTIONABILITY: probe finds unique target but hidden fails', async ({ page, locators, benchmarkResult }) => {
            await page.setContent('<input placeholder="What needs to be done?" style="display:none">');
            try {
                await locators.addTodo().fill('Milk', { timeout: 100 });
            } catch (e) {}
            expect(benchmarkResult.failureClass).toBe(FailureClass.ACTIONABILITY);
            expect(benchmarkResult.evidence.preActionResolutionObservation).toBe(1);
        });
    });
});
