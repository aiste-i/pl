import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { OracleSafety } from '../../utils/OracleSafety';

export class ReverseChildrenOrder implements DomOperator {
    category: 'structural' = 'structural';

    async isApplicable(page: Page, target: Locator): Promise<boolean> {
        if (await OracleSafety.isStructuralMutationUnsafe(target)) return false;
        return await target.evaluate((node: HTMLElement) => node.children.length >= 2);
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const reversed = await target.evaluate((node: HTMLElement) => {
            const children = Array.from(node.children);
            if (children.length < 2) {
                return false;
            }

            for (const child of children.reverse()) {
                node.appendChild(child);
            }

            return true;
        });

        if (reversed) {
            record.data = { action: 'ReverseChildrenOrder' };
        } else {
            record.addError('Not enough children to reorder');
        }
    }

    serialize(): { type: string; params?: any } {
        return { type: 'ReverseChildrenOrder' };
    }
}
