import * as dom from './dom';
import * as visual from './visual';

export type OperatorImplementationKind = 'dom' | 'visual';
export type OperatorBenchmarkScope = 'in-scope' | 'excluded-by-design';
export type ThesisMutationCategory =
  | 'structural'
  | 'content'
  | 'accessibility-semantic'
  | 'visibility-interaction-state'
  | 'visual';

export interface OperatorCatalogEntry {
  type: string;
  implementationKind: OperatorImplementationKind;
  benchmarkScope: OperatorBenchmarkScope;
  runtimeCategory: dom.DomOperator['category'] | 'visual';
  thesisCategory: ThesisMutationCategory;
  excludedReason?: string;
  factory(params?: any): dom.DomOperator;
}

export const OPERATOR_CATALOG: OperatorCatalogEntry[] = [
  {
    type: 'AttributeAdd',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: params => new dom.AttributeAdd(params?.name, params?.value),
  },
  {
    type: 'AttributeDelete',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.AttributeDelete(),
  },
  {
    type: 'AttributeMutator',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.AttributeMutator(),
  },
  {
    type: 'AttributeReplace',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.AttributeReplace(),
  },
  {
    type: 'StyleColor',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StyleColor(),
  },
  {
    type: 'StylePosition',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StylePosition(),
  },
  {
    type: 'StyleSize',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StyleSize(),
  },
  {
    type: 'StyleVisibility',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StyleVisibility(),
  },
  {
    type: 'TextDelete',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: () => new dom.TextDelete(),
  },
  {
    type: 'TextInsert',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: () => new dom.TextInsert(),
  },
  {
    type: 'TextNodeMutator',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: () => new dom.TextNodeMutator(),
  },
  {
    type: 'TextReplace',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: params => new dom.TextReplace(params?.newText),
  },
  {
    type: 'SubtreeDelete',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeDelete(),
  },
  {
    type: 'SubtreeInsert',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeInsert(),
  },
  {
    type: 'SubtreeMove',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeMove(),
  },
  {
    type: 'SubtreeSwap',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeSwap(),
  },
  {
    type: 'ReverseChildrenOrder',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.ReverseChildrenOrder(),
  },
  {
    type: 'SwapAdjacentSiblings',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SwapAdjacentSiblings(),
  },
  {
    type: 'TagMutator',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.TagMutator(),
  },
  {
    type: 'ContainerNodeMutator',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.ContainerNodeMutator(),
  },
  {
    type: 'ActionableNodeMutator',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ActionableNodeMutator(),
  },
  {
    type: 'ToggleCssClass',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.ToggleCssClass(),
  },
  {
    type: 'ChangeImageAlt',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ChangeImageAlt(),
  },
  {
    type: 'RemoveImageAlt',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.RemoveImageAlt(),
  },
  {
    type: 'ReplaceImageWithDiv',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceImageWithDiv(),
  },
  {
    type: 'ChangeButtonLabel',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ChangeButtonLabel(),
  },
  {
    type: 'RemoveInputNames',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.RemoveInputNames(),
  },
  {
    type: 'ReplaceAnchorWithSpan',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceAnchorWithSpan(),
  },
  {
    type: 'ReplaceHeadingWithP',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceHeadingWithP(),
  },
  {
    type: 'ReplaceThWithTd',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceThWithTd(),
  },
  {
    type: 'DuplicateId',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.DuplicateId(),
  },
  {
    type: 'SemanticToDiv',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.SemanticToDiv(),
  },
  {
    type: 'ChangeAriaLabel',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ChangeAriaLabel(),
  },
  {
    type: 'ToggleAriaExpanded',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ToggleAriaExpanded(),
  },
  {
    type: 'DistortMutator',
    implementationKind: 'visual',
    benchmarkScope: 'excluded-by-design',
    runtimeCategory: 'visual',
    thesisCategory: 'visual',
    excludedReason: 'Visual-only distortions do not cleanly answer the thesis question about locator-family robustness under non-breaking DOM/accessibility change.',
    factory: () => new visual.DistortMutator(),
  },
  {
    type: 'MaskMutator',
    implementationKind: 'visual',
    benchmarkScope: 'excluded-by-design',
    runtimeCategory: 'visual',
    thesisCategory: 'visual',
    excludedReason: 'Masking simulates visual regression rather than a DOM/accessibility mutation that can be interpreted at the locator-family level.',
    factory: () => new visual.MaskMutator(),
  },
];

export function getOperatorCatalog(): OperatorCatalogEntry[] {
  return [...OPERATOR_CATALOG];
}

export function getBenchmarkOperatorCatalog(): OperatorCatalogEntry[] {
  return OPERATOR_CATALOG.filter(entry => entry.benchmarkScope === 'in-scope');
}

export function createCatalogOperator(type: string, params?: any): dom.DomOperator {
  const entry = OPERATOR_CATALOG.find(candidate => candidate.type === type);
  if (!entry) {
    throw new Error(`Unknown operator type: ${type}`);
  }

  return entry.factory(params);
}
