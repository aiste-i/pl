import { Page, Locator } from 'playwright';
import { AccessibilityOperator } from './AccessibilityOperator';
import { MutationRecord } from '../../../MutationRecord';
import { OracleSafety } from '../../../utils/OracleSafety';

export class ChangeAriaLabel extends AccessibilityOperator {
    category: 'accessibility-semantic' = 'accessibility-semantic';

    async isApplicable(page: Page, target: Locator): Promise<boolean> {
        if (!await super.isApplicable(page, target)) return false;
        if (await OracleSafety.isProtected(target)) return false;

        return await target.evaluate((el: HTMLElement) => {
            if (el.hasAttribute('data-testid')) return false;
            return typeof el.getAttribute('aria-label') === 'string' && el.getAttribute('aria-label') !== '';
        });
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const originalLabel = await target.getAttribute('aria-label');
        const newLabel = 'Benchmark aria label mutation';

        await target.evaluate((el: HTMLElement, value: string) => {
            el.setAttribute('aria-label', value);
        }, newLabel);

        record.data = {
            type: 'ChangeAriaLabel',
            originalLabel,
            newLabel
        };
    }
}
