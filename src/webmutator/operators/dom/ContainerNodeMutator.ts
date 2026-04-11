import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { MutationTargetSafety } from '../../utils/MutationTargetSafety';

export class ContainerNodeMutator implements DomOperator {
    category: 'structural' = 'structural';
    private containerTags = ["body", "div", "span", "table", "td", "tr", "ul", "li"];

    async isApplicable(page: Page, target: Locator): Promise<boolean> {
        if (!(await MutationTargetSafety.isSafeStructuralTarget(target))) return false;
        return await target.evaluate((node: HTMLElement, tags) => {
            const tag = node.tagName.toLowerCase();
            const text = node.textContent || '';
            return tags.includes(tag) && node.children.length === 0 && text.trim().length > 0;
        }, this.containerTags);
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const mutated = await target.evaluate((node: HTMLElement, tags) => {
            const tag = node.tagName.toLowerCase();
            if (tags.includes(tag) && node.children.length === 0) {
                const text = node.textContent || "";
                if (text.trim().length > 0) {
                    node.textContent = text + "_mutant";
                    return true;
                }
            }
            return false;
        }, this.containerTags);

        if (mutated) {
            record.data = { action: 'ContainerNodeMutator' };
        } else {
            record.addError("Not a leaf container node with text");
        }
    }

    serialize(): { type: string, params?: any } {
        return { type: 'ContainerNodeMutator' };
    }
}

