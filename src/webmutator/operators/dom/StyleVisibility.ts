import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { OracleSafety } from '../../utils/OracleSafety';

export class StyleVisibility implements DomOperator {
    category: 'visibility' = 'visibility';
    
    async isApplicable(page: Page, target: Locator): Promise<boolean> { 
        // Cannot hide nodes that contain oracles as it would invalidate oracle actionability
        return !(await OracleSafety.isVisibilityMutationUnsafe(target));
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const newVal = await target.evaluate((node: HTMLElement) => {
            const current = node.style.display;
            const computed = window.getComputedStyle(node).display;
            const isVisible = current !== 'none' && computed !== 'none';
            const newVal = isVisible ? 'none' : 'block';
            node.style.display = newVal;
            return newVal;
        });

        record.data = { action: 'StyleVisibility', display: newVal };
    }

    serialize(): { type: string, params?: any } {
        return { type: 'StyleVisibility' };
    }
}
