import * as dom from './dom';

export class DomOperators {
    static getDomOperators(): dom.DomOperator[] {
        return [
            new dom.AttributeAdd(),
            new dom.AttributeDelete(),
            new dom.AttributeMutator(),
            new dom.AttributeReplace(),
            new dom.StyleColor(),
            new dom.StylePosition(),
            new dom.StyleSize(),
            new dom.StyleVisibility(),
            new dom.TextDelete(),
            new dom.TextInsert(),
            new dom.TextNodeMutator(),
            new dom.TextReplace(),
            new dom.SubtreeDelete(),
            new dom.SubtreeInsert(),
            new dom.SubtreeMove(),
            new dom.SubtreeSwap(),
            new dom.ReverseChildrenOrder(),
            new dom.TagMutator(),
            new dom.ContainerNodeMutator(),
            new dom.ActionableNodeMutator(),
            new dom.ChangeImageAlt(),
            new dom.RemoveImageAlt(),
            new dom.ReplaceImageWithDiv(),
            new dom.ChangeButtonLabel(),
            new dom.RemoveInputNames(),
            new dom.ReplaceAnchorWithSpan(),
            new dom.ReplaceHeadingWithP(),
            new dom.ReplaceThWithTd(),
            new dom.DuplicateId(),
            new dom.SemanticToDiv(),
            new dom.ChangeAriaLabel()
        ];
    }
}
