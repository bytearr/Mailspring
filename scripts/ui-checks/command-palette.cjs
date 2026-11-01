// Node-only interaction checks for the actual React component; mail actions are spies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('../../app/node_modules/react');
const Renderer = require('../../app/node_modules/react-test-renderer');
const { act } = Renderer;
const calls = [];
const accounts = [
  { id: 'one', label: 'Work', emailAddress: 'work@example.test' },
  { id: 'two', label: 'Personal', emailAddress: 'personal@example.test' },
];
let handlers;
let disposed = false;
const dialog = {
  open: false,
  showModal() {
    this.open = true;
  },
  close() {
    this.open = false;
  },
};
const componentExports = {};
const source = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../app/internal_packages/account-sidebar/lib/components/mail-command-palette.tsx'
  ),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
vm.runInNewContext(compiled, {
  exports: componentExports,
  document: { body: {}, getElementById: () => ({ scrollIntoView() {} }) },
  AppEnv: {
    commands: {
      add: (_, value) => {
        handlers = value;
        return {
          dispose() {
            disposed = true;
          },
        };
      },
      dispatch: (name) => calls.push([name]),
    },
  },
  require(name) {
    if (name === 'react') return React;
    if (name === 'react-dom') return { createPortal: (children) => children };
    if (name === 'mailspring-exports')
      return {
        localized: (value) => value,
        AccountStore: { accounts: () => accounts },
        Actions: new Proxy(
          {},
          {
            get:
              (_, key) =>
              (...args) =>
                calls.push([key, ...args]),
          }
        ),
      };
    throw new Error(name);
  },
});
let tree;
act(() => {
  tree = Renderer.create(React.createElement(componentExports.default), {
    createNodeMock: (element) => (element.type === 'dialog' ? dialog : { focus() {} }),
  });
});
const open = () => act(() => handlers['window:mail-command-palette']());
const input = () => tree.root.findByType('input');
const filter = (value) => act(() => input().props.onChange({ target: { value } }));
const key = (value) => act(() => input().props.onKeyDown({ key: value, preventDefault() {} }));
open();
assert.equal(dialog.open, true);
filter('personal@');
assert.equal(tree.root.findAllByProps({ role: 'option' }).length, 1);
key('Enter');
assert.equal(dialog.open, false);
assert.equal(calls.at(-1)[0], 'focusDefaultMailboxPerspectiveForAccounts');
assert.equal(calls.at(-1)[1][0].id, 'two');
open();
assert.equal(input().props.value, '');
key('ArrowUp');
key('Enter');
assert.equal(calls.at(-2)[0], 'switchPreferencesTab');
assert.equal(calls.at(-1)[0], 'openPreferences');
open();
filter('no matching commands');
const count = calls.length;
key('ArrowDown');
key('Enter');
assert.equal(calls.length, count);
assert.equal(input().props['aria-activedescendant'], undefined);
filter('unified');
key('Enter');
assert.equal(calls.at(-1)[1].length, 2);
open();
filter('compose');
key('Enter');
assert.equal(calls.at(-1)[0], 'composeNewBlankDraft');
act(() => tree.unmount());
assert.equal(disposed, true);
console.log(
  'PASS: filtering, account/unified actions, arrow wrapping, empty results, compose, reset and command cleanup'
);
