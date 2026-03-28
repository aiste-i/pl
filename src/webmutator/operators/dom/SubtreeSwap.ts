import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { OracleSafety } from '../../utils/OracleSafety';

export class SubtreeSwap implements DomOperator {
    category: 'structural' = 'structural';
    
    async isApplicable(page: Page, target: Locator): Promise<boolean> {
        if (await OracleSafety.isStructuralMutationUnsafe(target)) return false;
        return await target.evaluate((node: HTMLElement) => node.children.length >= 2);
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const swapped = await target.evaluate((node: HTMLElement) => {
            const children = Array.from(node.children);
            if (children.length >= 2) {
                const idx1 = Math.floor(Math.random() * children.length);
                let idx2 = Math.floor(Math.random() * children.length);
                while (idx1 === idx2) idx2 = Math.floor(Math.random() * children.length);

                const node1 = children[idx1];
                const node2 = children[idx2];

                const dummy = document.createElement('div');
                node.insertBefore(dummy, node1);
                node.insertBefore(node1, node2);
                node.insertBefore(node2, dummy);
                node.removeChild(dummy);
                return true;
            }
            return false;
        });

        if (swapped) {
            record.data = { action: 'SubtreeSwap' };
        } else {
            record.addError("Not enough children to swap");
        }
    }

    serialize(): { type: string, params?: any } {
        return { type: 'SubtreeSwap' };
    }
}
