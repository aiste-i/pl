import { Page, Locator } from 'playwright';
import { AccessibilityOperator } from './AccessibilityOperator';
import { MutationRecord } from '../../../MutationRecord';

export class ReplaceHeadingWithP extends AccessibilityOperator {
    category: 'structural' = 'structural';
    async isApplicable(page: Page, target: Locator): Promise<boolean> {
        if (!await super.isApplicable(page, target)) return false;

        return await target.evaluate((el: HTMLElement) => {
            const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
            return headingTags.includes(el.tagName);
        });
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        await target.evaluate((el: HTMLElement) => {
            const p = document.createElement('p');
            const style = window.getComputedStyle(el);
            
            // Preserve basic styling
            p.style.fontSize = style.fontSize;
            p.style.fontWeight = style.fontWeight;
            p.style.margin = style.margin;
            p.style.display = style.display;
            
            p.innerHTML = el.innerHTML;
            
            // Copy attributes
            if (el.id) p.id = el.id;
            if (el.className) p.className = el.className;
            
            if (el.parentNode) {
                el.parentNode.replaceChild(p, el);
            }
        });
        
        record.data = {
            type: 'ReplaceHeadingWithP'
        };
    }
}
