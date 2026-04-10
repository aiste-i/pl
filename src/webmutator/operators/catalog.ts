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
  domConditions: string;
  safetyGuard: string;
  excludedReason?: string;
  factory(params?: any): dom.DomOperator;
}

const GENERIC_ATTRIBUTE_MUTATION = {
  domConditions: 'Any non-oracle element; existing attributes remain mutable except for preserved data-testid values.',
  safetyGuard: 'Attribute mutations preserve data-testid so oracle roots stay grounded.',
} as const;

const SAFE_STRUCTURAL_MUTATION = {
  domConditions: 'Non-oracle, non-interactive node without interactive or form-critical descendants.',
  safetyGuard: 'Structural operators skip oracle-rooted and interactive/form-critical regions to avoid breaking task completion.',
} as const;

const TEXT_CONTENT_MUTATION = {
  domConditions: 'Element with non-empty visible text content.',
  safetyGuard: 'Targets remain present in the DOM; only textual content is changed.',
} as const;

const SAFE_VISUAL_MUTATION = {
  domConditions: 'Non-oracle, non-interactive node without interactive or form-critical descendants.',
  safetyGuard: 'Visual operators avoid hiding or displacing actionable controls and keep mutated nodes visible/actionable.',
} as const;

const ACCESSIBILITY_MUTATION = {
  domConditions: 'Elements that expose the specific accessibility attribute, role, or semantic mapping required by the operator.',
  safetyGuard: 'Operators stay within their targeted accessibility surface and do not mutate data-testid anchors.',
} as const;

const EXCLUDED_VISUAL_MUTATION = {
  domConditions: 'Rendered visual nodes eligible for bitmap-style distortion or masking.',
  safetyGuard: 'Excluded from the benchmark because they do not answer the DOM/accessibility robustness question directly.',
} as const;

export const OPERATOR_CATALOG: OperatorCatalogEntry[] = [
  {
    type: 'AttributeAdd',
    ...GENERIC_ATTRIBUTE_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: params => new dom.AttributeAdd(params?.name, params?.value),
  },
  {
    type: 'AttributeDelete',
    ...GENERIC_ATTRIBUTE_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.AttributeDelete(),
  },
  {
    type: 'AttributeMutator',
    ...GENERIC_ATTRIBUTE_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.AttributeMutator(),
  },
  {
    type: 'AttributeReplace',
    ...GENERIC_ATTRIBUTE_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.AttributeReplace(),
  },
  {
    type: 'StyleColor',
    ...SAFE_VISUAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StyleColor(),
  },
  {
    type: 'StylePosition',
    ...SAFE_VISUAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StylePosition(),
  },
  {
    type: 'StyleSize',
    ...SAFE_VISUAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StyleSize(),
  },
  {
    type: 'StyleVisibility',
    ...SAFE_VISUAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.StyleVisibility(),
  },
  {
    type: 'TextDelete',
    ...TEXT_CONTENT_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: () => new dom.TextDelete(),
  },
  {
    type: 'TextInsert',
    ...TEXT_CONTENT_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: () => new dom.TextInsert(),
  },
  {
    type: 'TextNodeMutator',
    ...TEXT_CONTENT_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: () => new dom.TextNodeMutator(),
  },
  {
    type: 'TextReplace',
    ...TEXT_CONTENT_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'content',
    thesisCategory: 'content',
    factory: params => new dom.TextReplace(params?.newText),
  },
  {
    type: 'SubtreeDelete',
    ...SAFE_STRUCTURAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeDelete(),
  },
  {
    type: 'SubtreeInsert',
    ...SAFE_STRUCTURAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeInsert(),
  },
  {
    type: 'SubtreeMove',
    ...SAFE_STRUCTURAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeMove(),
  },
  {
    type: 'SubtreeSwap',
    ...SAFE_STRUCTURAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SubtreeSwap(),
  },
  {
    type: 'ReverseChildrenOrder',
    ...SAFE_STRUCTURAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.ReverseChildrenOrder(),
  },
  {
    type: 'SwapAdjacentSiblings',
    ...SAFE_STRUCTURAL_MUTATION,
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.SwapAdjacentSiblings(),
  },
  {
    type: 'TagMutator',
    domConditions: 'Non-oracle text-level semantic tags with a defined replacement mapping (for example h1->h2 or p->div).',
    safetyGuard: 'Only non-interactive semantic text tags are remapped so controls and oracle anchors remain intact.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.TagMutator(),
  },
  {
    type: 'ContainerNodeMutator',
    domConditions: 'Leaf container nodes whose tag is one of body/div/span/table/td/tr/ul/li and whose text is non-empty.',
    safetyGuard: 'Only leaf container text is altered; descendants are not removed or hidden.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'structural',
    thesisCategory: 'structural',
    factory: () => new dom.ContainerNodeMutator(),
  },
  {
    type: 'ActionableNodeMutator',
    domConditions: 'Anchor, input, or button elements with a mutable href/id/class/title surface.',
    safetyGuard: 'Mutations stay on the actionable node itself rather than deleting or hiding required controls.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ActionableNodeMutator(),
  },
  {
    type: 'ToggleCssClass',
    domConditions: 'Elements with a classList that can be toggled between stable style classes.',
    safetyGuard: 'Class toggles preserve node presence and are blocked for oracle-protected targets.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'visibility',
    thesisCategory: 'visibility-interaction-state',
    factory: () => new dom.ToggleCssClass(),
  },
  {
    type: 'ChangeImageAlt',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'img elements with an alt attribute.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ChangeImageAlt(),
  },
  {
    type: 'RemoveImageAlt',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'img elements with an alt attribute.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.RemoveImageAlt(),
  },
  {
    type: 'ReplaceImageWithDiv',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'img elements that can be replaced with a non-semantic div.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceImageWithDiv(),
  },
  {
    type: 'ChangeButtonLabel',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'button elements with a visible or accessible label.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ChangeButtonLabel(),
  },
  {
    type: 'RemoveInputNames',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'Named form controls whose name attributes can be removed.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.RemoveInputNames(),
  },
  {
    type: 'ReplaceAnchorWithSpan',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'Anchor elements that can be downgraded to non-link spans.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceAnchorWithSpan(),
  },
  {
    type: 'ReplaceHeadingWithP',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'Heading elements h1-h6.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceHeadingWithP(),
  },
  {
    type: 'ReplaceThWithTd',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'th elements inside table header structures.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ReplaceThWithTd(),
  },
  {
    type: 'DuplicateId',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'Elements that already expose an id attribute.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.DuplicateId(),
  },
  {
    type: 'SemanticToDiv',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'Semantic landmark or sectioning elements with a valid div replacement path.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.SemanticToDiv(),
  },
  {
    type: 'ChangeAriaLabel',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'Elements that already expose aria-label.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ChangeAriaLabel(),
  },
  {
    type: 'ToggleAriaExpanded',
    safetyGuard: ACCESSIBILITY_MUTATION.safetyGuard,
    domConditions: 'Elements with an aria-expanded state.',
    implementationKind: 'dom',
    benchmarkScope: 'in-scope',
    runtimeCategory: 'accessibility-semantic',
    thesisCategory: 'accessibility-semantic',
    factory: () => new dom.ToggleAriaExpanded(),
  },
  {
    type: 'DistortMutator',
    ...EXCLUDED_VISUAL_MUTATION,
    implementationKind: 'visual',
    benchmarkScope: 'excluded-by-design',
    runtimeCategory: 'visual',
    thesisCategory: 'visual',
    excludedReason: 'Visual-only distortions do not cleanly answer the thesis question about locator-family robustness under non-breaking DOM/accessibility change.',
    factory: () => new visual.DistortMutator(),
  },
  {
    type: 'MaskMutator',
    ...EXCLUDED_VISUAL_MUTATION,
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
