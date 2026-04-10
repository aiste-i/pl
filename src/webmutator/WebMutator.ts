import { Page, Locator } from 'playwright';
import { MutationMode } from './MutationMode';
import { MutationRecord } from './MutationRecord';
import { DomOperator } from './operators/dom/DomOperator';
import { evaluateMutationApplicability } from './operators/applicability';

export class WebMutator {
    mutationMode: MutationMode;

    constructor(mutationMode: MutationMode = MutationMode.DOM) {
        this.mutationMode = mutationMode;
    }

    async applyMutation(page: Page, selector: string, operator: DomOperator): Promise<MutationRecord> {
        try {
            const target = page.locator(selector).first();
            const applicability = await evaluateMutationApplicability(page, target, operator);
            if (!applicability.applicable) {
                return MutationRecord.fromError(`Mutation skipped: ${applicability.reason} for selector ${selector}`);
            }

            const record = new MutationRecord(true);
            record.originalXpath = selector; // Using selector as identifier for now
            record.operator = operator.constructor.name;

            await operator.applyOperator(page, target, record);
            
            // Mark mutation in DOM if needed, similar to reference
            await target.evaluate((node: HTMLElement) => {
                // Protect data-testid from being overwritten by the 'mutation' marker if it was used as an ID
                node.setAttribute('mutation', 'yes');
                node.setAttribute('mutationoperator', 'applied');
            });

            return record;
        } catch (error: any) {
            return MutationRecord.fromError(error.message);
        }
    }
}
