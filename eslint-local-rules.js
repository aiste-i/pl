module.exports = {
  'locator-getByRole-warn': {
    meta: { 
      type: 'suggestion', 
      messages: { 
        missingGetByRole: 'Strategy "getByRole" should ideally use the "getByRole()" method. Found: "{{ actual }}"' 
      } 
    },
    create(context) {
      return {
        Property(node) {
          if (node.key.name === 'getByRole' && !findCall(node.value, 'getByRole')) {
            const actual = context.sourceCode.getText(node.value);
            context.report({ 
              node, 
              messageId: 'missingGetByRole',
              data: { actual }
            });
          }
        }
      };
    }
  },
  'locator-strategies-error': {
    meta: {
      type: 'problem',
      messages: {
        missingGetByTestId: 'Strategy "getByTestId" MUST use the "getByTestId()" method. Found: "{{ actual }}"',
        missingCssPrefix: 'Strategy "css" MUST use "locator()" with a selector starting with "css=". Found: "{{ actual }}"',
        missingXpathPrefix: 'Strategy "xpath" MUST use "locator()" with a selector starting with "xpath=". Found: "{{ actual }}"',
      },
    },
    create(context) {
      return {
        Property(node) {
          const keyName = node.key.name || node.key.value;
          const value = node.value;

          if (keyName === 'getByTestId' && !findCall(value, 'getByTestId')) {
            const actual = context.sourceCode.getText(value);
            context.report({ node, messageId: 'missingGetByTestId', data: { actual } });
          }
          if (keyName === 'css' && !checkLocatorPrefix(value, 'css=')) {
            const actual = context.sourceCode.getText(value);
            context.report({ node, messageId: 'missingCssPrefix', data: { actual } });
          }
          if (keyName === 'xpath' && !checkLocatorPrefix(value, 'xpath=')) {
            const actual = context.sourceCode.getText(value);
            context.report({ node, messageId: 'missingXpathPrefix', data: { actual } });
          }
        },
      };
    },
  },
};

function findCall(node, methodName) {
  if (!node) return false;
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return findCall(node.body, methodName);
  }
  const expr = node.expression || node;
  if (expr.type === 'CallExpression') {
    if (expr.callee.property && expr.callee.property.name === methodName) return true;
    return findCall(expr.callee.object, methodName);
  }
  if (expr.type === 'BlockStatement') {
    for (const s of expr.body) {
      if (s.type === 'ReturnStatement') return findCall(s.argument, methodName);
    }
  }
  return false;
}

function checkLocatorPrefix(node, prefix) {
  if (!node) return false;
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return checkLocatorPrefix(node.body, prefix);
  }
  const expr = node.expression || node;
  if (expr.type === 'CallExpression') {
    if (expr.callee.property && expr.callee.property.name === 'locator') {
      const arg = expr.arguments[0];
      // Check for Literal (e.g., 'css=...')
      if (arg && arg.type === 'Literal' && typeof arg.value === 'string' && arg.value.startsWith(prefix)) {
        return true;
      }
      // Check for TemplateLiteral (e.g., `css=li:has-text("${text}")`)
      if (arg && arg.type === 'TemplateLiteral') {
        const firstQuasi = arg.quasis[0];
        if (firstQuasi && firstQuasi.value.raw.startsWith(prefix)) {
          return true;
        }
      }
    }
    return checkLocatorPrefix(expr.callee.object, prefix);
  }
  if (expr.type === 'BlockStatement') {
    for (const s of expr.body) {
      if (s.type === 'ReturnStatement') return checkLocatorPrefix(s.argument, prefix);
    }
  }
  return false;
}
