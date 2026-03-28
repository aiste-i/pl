import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { RandomUtils } from '../../utils/RandomUtils';

export class StylePosition implements DomOperator {
    category: 'visibility' = 'visibility';
    
    async isApplicable(page: Page, target: Locator): Promise<boolean> { return true; }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const coords = RandomUtils.getRandomCoordinates();
        
        await target.evaluate((node: HTMLElement, coords) => {
            node.style.position = 'absolute';
            node.style.left = `${coords.x}px`;
            node.style.top = `${coords.y}px`;
        }, coords);

        record.data = { action: 'StylePosition', ...coords };
    }

    serialize(): { type: string, params?: any } {
        return { type: 'StylePosition' };
    }
}

