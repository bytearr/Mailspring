// Compile the application chrome with each theme using the bundled LESS version.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const less = require('../../app/node_modules/less');
const root = path.resolve(__dirname, '../..');
const entries = [
  'app/static/style/index.less',
  'app/internal_packages/account-sidebar/styles/account-sidebar.less',
  'app/internal_packages/composer/styles/composer.less',
  'app/internal_packages/message-list/styles/message-list.less',
  'app/internal_packages/thread-list/styles/thread-list.less',
  'app/internal_packages/thread-search/styles/thread-search-bar.less',
  'app/internal_packages/preferences/styles/preferences.less',
  'app/internal_packages/onboarding/styles/onboarding.less',
];
(async () => {
  for (const theme of ['light', 'dark']) {
    const paths = [path.join(root, 'app/static/style/base'), path.join(root, 'app/static/style')];
    if (theme === 'dark') paths.unshift(path.join(root, 'app/internal_packages/ui-dark/styles'));
    for (const entry of entries) {
      const filename = path.join(root, entry);
      const { css } = await less.render(fs.readFileSync(filename, 'utf8'), { filename, paths });
      assert.ok(css.length > 0, entry);
      if (entry.endsWith('/index.less')) {
        assert.ok(css.includes('prefers-reduced-motion: reduce'));
        assert.ok(css.includes('transition-duration: 0.01ms !important'));
      }
      if (theme === 'dark' && entry.includes('/onboarding/')) {
        assert.ok(css.includes('#0d0f12'), 'Account setup must use the dark surface');
      }
    }
  }
  console.log(
    `PASS: ${entries.length} stylesheet entry points in light and dark, including reduced-motion output`
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
