# Precision desktop UI

This redesign changes the production React components and their owning LESS files. The visual direction is compact desktop panels, restrained blue selection, clear typography and quiet movement, informed by [Cursor's desktop UI](https://cursor.com/download). No branding or editor functionality is copied.

## What changes

- The built-in dark theme uses layered #0D0F12 / #12151A / #191D23 surfaces, #292E36 borders and a cool blue accent. New profiles default to dark; existing saved theme choices remain respected. The existing system accent preference remains supported.
- Shared typography, corner radii, focus rings, animation durations and easing live in the base tokens. Styles stay with their existing components instead of a large overriding theme stylesheet.
- The sidebar has a full account identity control, unified scope description, compose entry point, command launcher and quieter folder counters. The existing native account menu, folder tree and account shortcuts remain in use.
- The message list retains virtualization and row dimensions. Sender/subject/preview/date hierarchy is refined; account dots use configured account colors and expose addresses in tooltips. Hover and selected surfaces do not move rows or animate list geometry.
- Reading-pane subjects, thread spacing and rounded surfaces are updated without changing HTML email rendering. Attachments can shrink to fit narrow panes.
- The standalone composer adds a heading and current subject; recipient fields and the action bar share the desktop styling. Draft sessions, attachments, signatures and send actions are unchanged.
- Settings, search, popovers, modals, empty states and account setup share the design. Account setup no longer forces a separate light palette. OAuth provider webviews retain their own content.
- The command palette uses **Ctrl/Cmd+Shift+P**, preserving **Ctrl/Cmd+K** for inserting links. It filters compose, search, unified inbox, individual accounts and preferences. Arrow keys select; Enter executes; Escape closes. Native dialog handles modal focus containment and restoration.
- Reduced-motion CSS suppresses chrome transitions and animations, including the command palette. Third-party webviews and existing inbox-zero iframe animation are outside that CSS boundary.

## Architecture and dependencies

No new runtime or development dependencies. No changes to the sync engine, authentication handlers, IMAP/SMTP, task queue, database or mail serialization. Commands dispatch existing actions. The palette's command handler is disposed when the sidebar unmounts. Destructive mail actions are intentionally not added to this palette.

Sidebar collapse, new density settings, skeleton loading and custom modal exit lifecycles are not implemented. Existing resizing, layouts and keyboard shortcuts are retained. Native OS menus retain native rendering.

## Development and checks

Use the repository's supported Node/npm versions, then:

```sh
npm install
npm start
npm run lint:check
npm run typecheck
node scripts/ui-checks/command-palette.cjs
node scripts/ui-checks/styles.cjs
npm run build
```

For an existing profile, select Dark under Preferences → Appearance. Development startup uses the separate Mailspring-dev profile.

### Validation in the implementation environment

- TypeScript check and repository-wide ESLint passed.
- Node interaction checks pass for the actual palette React component: filtering, individual and unified account routing, compose, arrow wrapping, no-match behavior, reset on reopen and disposal. Mail actions and DOM refs are mocked; these do not establish browser focus behavior.
- Bundled LESS compilation passes in light and dark, including account setup and reduced-motion declarations.
- Production compilation and Linux application packaging completed during implementation. The subsequent Debian installer stage failed because the environment does not have `fakeroot`. This is not a successful end-to-end installer build.
- Electron runtime launch failed in the restricted headless environment (display/GPU errors and SIGTRAP). Browser download also failed. No genuine runtime screenshots were captured.
- Live account authentication, send/receive, drafts, attachment transfers, browser focus containment, visual overflow at different sizes, HTML-email appearance and performance with large mailboxes remain unverified. Existing end-to-end tests depend on a developer-local mailbox fixture unavailable here.

### Manual review before release

Check Windows, macOS and Linux at 900×650, 1280×800 and 1600×1000, including long account names and RTL languages. Switch between two real accounts and unified inbox; navigate unread messages by keyboard; test archive/delete/undo/search; reply, forward, attach, save and reopen drafts, send and receive. Review plain-text and branded HTML messages. Exercise all account setup methods and settings tabs. Confirm palette Tab containment, Escape dismissal and focus restoration, and repeat with reduced motion enabled. Inspect narrow attachment rows, multiple labels, native titlebars and long subjects.
