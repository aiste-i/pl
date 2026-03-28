import { test, expect } from './baseFixture';
import { WebMutator } from '../src/webmutator/WebMutator';
import { TextReplace } from '../src/webmutator/operators/dom/TextReplace';
import { MutationMode } from '../src/webmutator/MutationMode';
import { StyleColor } from '../src/webmutator/operators/dom/StyleColor';

test.describe('React Application Mutation', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should apply text replacement mutation to the header', async ({ page }) => {
        const mutator = new WebMutator(MutationMode.DOM);
        const operator = new TextReplace("MUTANT HEADER");
        
        const selector = 'h1';
        
        const originalText = await page.locator(selector).textContent();
        console.log(`Original Text: ${originalText}`);

        const record = await mutator.applyMutation(page, selector, operator);
        
        expect(record.success).toBe(true);
        
        const mutatedText = await page.locator(selector).textContent();
        console.log(`Mutated Text: ${mutatedText}`);
        
        expect(mutatedText).toBe("MUTANT HEADER");

        const mutationAttr = await page.locator(selector).getAttribute('mutation');
        expect(mutationAttr).toBe('yes');
    });

    test('should apply style mutation to the input field', async ({ page }) => {
        const mutator = new WebMutator(MutationMode.DOM);
        const operator = new StyleColor();
        
        const selector = '.new-todo';
        
        await mutator.applyMutation(page, selector, operator);
        
        const color = await page.locator(selector).evaluate(el => el.style.color);
        console.log(`Applied Style Color: ${color}`);
        expect(color).toBeTruthy();
    });
});