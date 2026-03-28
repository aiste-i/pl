import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { RandomUtils } from '../../utils/RandomUtils';

export class StyleSize implements DomOperator {
    category: 'visibility' = 'visibility';
    
    async isApplicable(page: Page, target: Locator): Promise<boolean> { return true; }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const size = RandomUtils.getRandomCoordinates(); // reusing for w/h
        
        await target.evaluate((node: HTMLElement, size) => {
            node.style.display = 'block';
            node.style.width = `${size.x}px`;
            node.style.height = `${size.y}px`;
        }, size);

        record.data = { action: 'StyleSize', width: size.x, height: size.y };
    }

    serialize(): { type: string, params?: any } {
        return { type: 'StyleSize' };
    }
}

