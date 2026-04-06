import { Page, Locator } from 'playwright';
import { DomOperator } from './DomOperator';
import { MutationRecord } from '../../MutationRecord';
import { MutationTargetSafety } from '../../utils/MutationTargetSafety';

export class TagMutator implements DomOperator {
    category: 'structural' = 'structural';
    private switchMap: { [key: string]: string } = {
        "h2": "h3",
        "h1": "h2",
        "h3": "h2",
        "h4": "h3",
        "h5": "h4",
        "h6": "h5",
        "p": "div",
        "span": "div",
        "b": "i",
        "i": "b",
        "strong": "b",
        "em": "i"
    };

    async isApplicable(page: Page, target: Locator): Promise<boolean> {
        if (!(await MutationTargetSafety.isSafeStructuralTarget(target))) return false;
        const tag = await target.evaluate(n => n.tagName.toLowerCase());
        return !!this.switchMap[tag];
    }

    async applyOperator(page: Page, target: Locator, record: MutationRecord): Promise<void> {
        const result = await target.evaluate((node: HTMLElement, map) => {
            const currentTag = node.tagName.toLowerCase();
            const mutantTag = map[currentTag];
            
            if (mutantTag) {
                const newNode = document.createElement(mutantTag);
                
                // Copy attributes
                for (let i = 0; i < node.attributes.length; i++) {
                    newNode.setAttribute(node.attributes[i].name, node.attributes[i].value);
                }
                
                // Copy children
                while (node.firstChild) {
                    newNode.appendChild(node.firstChild);
                }
                
                if (node.parentElement) {
                    node.parentElement.replaceChild(newNode, node);
                    return { success: true, from: currentTag, to: mutantTag };
                }
            }
            return { success: false };
        }, this.switchMap);

        if (result.success) {
            record.data = { action: 'TagMutator', from: result.from, to: result.to };
        } else {
            record.addError("No tag mapping found for " + await target.evaluate(n => n.tagName.toLowerCase()));
        }
    }

    serialize(): { type: string, params?: any } {
        return { type: 'TagMutator' };
    }
}

