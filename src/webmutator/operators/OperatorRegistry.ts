import * as dom from './dom';

export class OperatorRegistry {
    static createOperator(type: string, params?: any): dom.DomOperator {
        switch (type) {
            case 'AttributeAdd': return new dom.AttributeAdd(params?.name, params?.value);
            case 'AttributeDelete': return new dom.AttributeDelete();
            case 'AttributeMutator': return new dom.AttributeMutator();
            case 'AttributeReplace': return new dom.AttributeReplace();
            case 'StyleColor': return new dom.StyleColor();
            case 'StylePosition': return new dom.StylePosition();
            case 'StyleSize': return new dom.StyleSize();
            case 'StyleVisibility': return new dom.StyleVisibility();
            case 'TextDelete': return new dom.TextDelete();
            case 'TextInsert': return new dom.TextInsert();
            case 'TextNodeMutator': return new dom.TextNodeMutator();
            case 'TextReplace': return new dom.TextReplace(params?.newText);
            case 'SubtreeDelete': return new dom.SubtreeDelete();
            case 'SubtreeInsert': return new dom.SubtreeInsert();
            case 'SubtreeMove': return new dom.SubtreeMove();
            case 'SubtreeSwap': return new dom.SubtreeSwap();
            case 'TagMutator': return new dom.TagMutator();
            case 'ContainerNodeMutator': return new dom.ContainerNodeMutator();
            case 'ActionableNodeMutator': return new dom.ActionableNodeMutator();
            case 'ChangeImageAlt': return new dom.ChangeImageAlt();
            case 'RemoveImageAlt': return new dom.RemoveImageAlt();
            case 'ReplaceImageWithDiv': return new dom.ReplaceImageWithDiv();
            case 'ChangeButtonLabel': return new dom.ChangeButtonLabel();
            case 'RemoveInputNames': return new dom.RemoveInputNames();
            case 'ReplaceAnchorWithSpan': return new dom.ReplaceAnchorWithSpan();
            case 'ReplaceHeadingWithP': return new dom.ReplaceHeadingWithP();
            case 'ReplaceThWithTd': return new dom.ReplaceThWithTd();
            case 'DuplicateId': return new dom.DuplicateId();
            case 'SemanticToDiv': return new dom.SemanticToDiv();
            default:
                throw new Error(`Unknown operator type: ${type}`);
        }
    }
}
