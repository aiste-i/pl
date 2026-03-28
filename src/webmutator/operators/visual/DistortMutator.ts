import { Page, Locator } from 'playwright';
import { VisualOperator } from './VisualOperator';
import { MutationRecord } from '../../MutationRecord';

export class DistortMutator implements VisualOperator {
    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        await target.evaluate((node: HTMLElement) => {
            node.style.filter = 'blur(5px) grayscale(100%)';
            node.style.transform = 'skew(10deg, 10deg)';
        });

        record.data = { action: 'DistortMutator' };
    }
}
