import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { OracleSafety } from '../../utils/OracleSafety';

export class SubtreeMove implements DomOperator {
    category: 'structural' = 'structural';
    
    async isApplicable(page: Page, target: Locator): Promise<boolean> {
        // Cannot move oracle context
        if (await OracleSafety.isStructuralMutationUnsafe(target)) return false;

        return await target.evaluate((node: HTMLElement) => {
            const containers = Array.from(document.querySelectorAll('div, span, p, section, main, footer, header'));
            return containers.some(c => 
                c !== node && 
                c !== node.parentElement && 
                !node.contains(c) &&
                !c.hasAttribute('data-testid') && // Don't move INTO an oracle node
                !c.querySelector('[data-testid]') // Don't move INTO an oracle context
            );
        });
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const moved = await target.evaluate((node: HTMLElement) => {
            const containers = Array.from(document.querySelectorAll('div, span, p, section, main, footer, header'));
            // Filter out self, parent, children, and oracle contexts
            const available = containers.filter(c => 
                c !== node && 
                c !== node.parentElement && 
                !node.contains(c) &&
                !c.hasAttribute('data-testid') &&
                !c.querySelector('[data-testid]')
            );

            if (available.length > 0) {
                const targetContainer = available[Math.floor(Math.random() * available.length)];
                targetContainer.appendChild(node);
                targetContainer.setAttribute('mutated', 'true');
                return true;
            }
            return false;
        });

        if (moved) {
            record.data = { action: 'SubtreeMove' };
        } else {
            record.addError("No target container found for move");
        }
    }

    serialize(): { type: string, params?: any } {
        return { type: 'SubtreeMove' };
    }
}
