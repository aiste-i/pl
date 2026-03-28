export const STRATEGIES = ['semantic-first', 'css', 'xpath'] as const;
export type StrategyName = (typeof STRATEGIES)[number];

export { getTodoMVCLocators, TodoMVCLocators } from './apps/todomvc.locators';
