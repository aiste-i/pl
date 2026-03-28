import { MutationRecord } from './MutationRecord';
import { DomOperator } from './operators/dom/DomOperator';

export class MutationCandidate {
    selector: string;
    operator: DomOperator;
    record?: MutationRecord;
    url?: string;
    fingerprint?: any;

    constructor(selector: string, operator: DomOperator, url?: string, fingerprint?: any) {
        this.selector = selector;
        this.operator = operator;
        this.url = url;
        this.fingerprint = fingerprint;
    }

    toJSON() {
        return {
            selector: this.selector,
            operator: {
                ...this.operator.serialize(),
                category: this.operator.category
            },
            url: this.url,
            fingerprint: this.fingerprint,
            record: this.record
        };
    }
}