import { Page, Locator } from 'playwright';
import { VisualOperator } from './VisualOperator';
import { MutationRecord } from '../../MutationRecord';

export class MaskMutator implements VisualOperator {
    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        await target.evaluate((node: HTMLElement) => {
            node.style.backgroundColor = 'black';
            node.style.color = 'black';
            node.style.visibility = 'visible';
            node.style.opacity = '1';
        });

        record.data = { action: 'MaskMutator' };
    }
}
