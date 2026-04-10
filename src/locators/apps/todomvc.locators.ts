import { Locator, Page } from '@playwright/test';
import { StrategyName } from '..';

export interface TodoMVCLocators {
  addTodo(page: Page): Locator & { semanticEntryPoint?: string };
  list(page: Page): Locator & { semanticEntryPoint?: string };
  itemNth(page: Page, index: number): Locator & { semanticEntryPoint?: string };
  itemLabel(item: Locator): Locator & { semanticEntryPoint?: string };
  itemByText(page: Page, text: string): Locator & { semanticEntryPoint?: string };
  toggleCheckbox(item: Locator): Locator & { semanticEntryPoint?: string };
  deleteButton(item: Locator): Locator & { semanticEntryPoint?: string };
  editInput(item: Locator): Locator & { semanticEntryPoint?: string }; 
}

export const TODO_STRATEGIES = {
  addTodo: {
    'semantic-first': (page: Page) => {
        const l = page.getByPlaceholder('What needs to be done?');
        (l as any).semanticEntryPoint = 'getByPlaceholder';
        return l;
    },
    css: (page: Page) => page.locator('css=#todo-input'),
    xpath: (page: Page) =>
      page.locator('xpath=//input[@id="todo-input"]'),
  },

  list: {
    'semantic-first': (page: Page) => {
        const l = page.getByRole('list');
        (l as any).semanticEntryPoint = 'getByRole';
        return l;
    },
    css: (page: Page) => page.locator('css=ul.todo-list'),
    xpath: (page: Page) =>
      page.locator('xpath=//ul[contains(@class,"todo-list")]'),
  },

  itemNth: {
    'semantic-first': (page: Page, index: number) => {
        const l = page.getByRole('listitem').nth(index);
        (l as any).semanticEntryPoint = 'getByRole';
        return l;
    },
    css: (page: Page, index: number) =>
      page.locator('css=ul.todo-list').locator('css=li').nth(index),
    xpath: (page: Page, index: number) =>
      page.locator('xpath=//ul[contains(@class,"todo-list")]').locator('xpath=./li').nth(index),
  },

  itemLabel: {
    'semantic-first': (item: Locator) => {
        const l = item.getByText(/\S+/, { exact: false });
        (l as any).semanticEntryPoint = 'getByText';
        return l;
    }, 
    css: (item: Locator) => item.locator('css=label'),
    xpath: (item: Locator) => item.locator('xpath=./div[@class="view"]/label'),
  },

  itemByText: {
    'semantic-first': (page: Page, text: string) => {
        const l = page.getByText(text, { exact: true });
        (l as any).semanticEntryPoint = 'getByText';
        return l;
    },
    css: (page: Page, text: string) => page.locator(`css=li:has-text("${text}")`),
    xpath: (page: Page, text: string) =>
      page.locator(
        `xpath=//li[contains(normalize-space(.), "${text}")]`
      ),
  },

  toggleCheckbox: {
    'semantic-first': (item: Locator) => {
        const l = item.getByRole('checkbox');
        (l as any).semanticEntryPoint = 'getByRole';
        return l;
    },
    css: (item: Locator) => item.locator('css=input.toggle[type="checkbox"]'),
    xpath: (item: Locator) => item.locator('xpath=.//input[@type="checkbox"]'),
  },

  deleteButton: {
    'semantic-first': (item: Locator) => {
        const l = item.getByRole('button');
        (l as any).semanticEntryPoint = 'getByRole';
        return l;
    },
    css: (item: Locator) => item.locator('css=button.destroy'),
    xpath: (item: Locator) => item.locator('xpath=.//button[@class="destroy"]'),
  },

  editInput: {
    'semantic-first': (item: Locator) => {
        const l = item.getByRole('textbox');
        (l as any).semanticEntryPoint = 'getByRole';
        return l;
    },
    css: (item: Locator) => item.locator('css=input[type="text"]'),
    xpath: (item: Locator) =>
      item.locator('xpath=.//input[@type="text"]'),
  },
} as const;

// Separate Oracle implementation using data-testid only
export const TODO_ORACLE = {
    addTodo: (page: Page) => page.getByTestId('text-input'),
    list: (page: Page) => page.getByTestId('todo-list'),
    itemByText: (page: Page, text: string) => page.getByTestId('todo-item').filter({ hasText: text }),
    toggleCheckbox: (item: Locator) => item.getByTestId('todo-item-toggle'),
    deleteButton: (item: Locator) => item.getByTestId('todo-item-button'),
} as const;

const pick = (strategy: StrategyName) =>
  <K extends keyof typeof TODO_STRATEGIES>(key: K) =>
    (...args: any[]) => {
      const impl = (TODO_STRATEGIES[key] as any)[strategy];
      if (!impl) throw new Error(`No selector for "${String(key)}" under strategy "${strategy}"`);
      return impl(...args);
    };

export function getTodoMVCLocators(strategy: StrategyName): TodoMVCLocators {
  const s = pick(strategy);
  return {
    addTodo: s('addTodo'),
    list: s('list'),
    itemNth: s('itemNth'),
    itemLabel: s('itemLabel'),
    itemByText: s('itemByText'),
    toggleCheckbox: s('toggleCheckbox'),
    deleteButton: s('deleteButton'),
    editInput: s('editInput'),
  };
}

export function getTodoMVCOracle() {
    return TODO_ORACLE;
}
