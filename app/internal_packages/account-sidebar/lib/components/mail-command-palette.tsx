import React from 'react';
import ReactDOM from 'react-dom';
import { AccountStore, Actions, localized } from 'mailspring-exports';

// Native dialog provides focus containment, Escape dismissal and focus restoration.
export default function MailCommandPalette() {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);
  const [accounts, setAccounts] = React.useState(AccountStore.accounts());

  React.useEffect(() => {
    const disposable = AppEnv.commands.add(document.body, {
      'window:mail-command-palette': () => {
        setAccounts(AccountStore.accounts());
        setQuery('');
        setSelected(0);
        if (!dialog.current.open) dialog.current.showModal();
        input.current.focus();
      },
    });
    return () => disposable.dispose();
  }, []);

  const commands = [
    {
      id: 'compose',
      label: localized('Compose'),
      detail: localized('New Message'),
      run: () => Actions.composeNewBlankDraft(),
    },
    {
      id: 'search',
      label: localized('Search'),
      detail: localized('All Accounts'),
      run: () => AppEnv.commands.dispatch('core:focus-search'),
    },
    {
      id: 'unified',
      label: localized('Unified Inbox'),
      detail: localized('All Accounts'),
      run: () => Actions.focusDefaultMailboxPerspectiveForAccounts(accounts),
    },
    ...accounts.map((account) => ({
      id: account.id,
      label: account.label,
      detail: account.emailAddress,
      run: () => Actions.focusDefaultMailboxPerspectiveForAccounts([account]),
    })),
    {
      id: 'preferences',
      label: localized('Preferences'),
      detail: localized('Settings'),
      run: () => Actions.openPreferences(),
    },
    {
      id: 'accounts',
      label: localized('Manage Accounts'),
      detail: localized('Settings'),
      run: () => {
        Actions.switchPreferencesTab('Accounts');
        Actions.openPreferences();
      },
    },
  ].filter((command) =>
    `${command.label} ${command.detail}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );

  const execute = (index: number) => {
    const command = commands[index];
    if (!command) return;
    dialog.current.close();
    command.run();
  };

  return ReactDOM.createPortal(
    <dialog ref={dialog} className="mail-command-palette" aria-label={localized('Commands')}>
      <div className="mail-command-heading">
        <span>{localized('Commands')}</span>
        <button
          className="btn btn-bare"
          aria-label={localized('Close')}
          onClick={() => dialog.current.close()}
        >
          Esc
        </button>
      </div>
      <input
        ref={input}
        aria-label={localized('Search commands')}
        placeholder={localized('Search commands')}
        role="combobox"
        aria-controls="mail-command-results"
        aria-expanded={true}
        aria-autocomplete="list"
        aria-activedescendant={commands[selected] ? `mail-command-${selected}` : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelected(0);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const next = commands.length
              ? (selected + (event.key === 'ArrowDown' ? 1 : commands.length - 1)) % commands.length
              : 0;
            setSelected(next);
            document.getElementById(`mail-command-${next}`)?.scrollIntoView({ block: 'nearest' });
          } else if (event.key === 'Enter') {
            event.preventDefault();
            execute(selected);
          }
        }}
      />
      <div
        id="mail-command-results"
        role="listbox"
        aria-label={localized('Commands')}
        className="mail-command-results"
      >
        {commands.map((command, index) => (
          <div
            key={command.id}
            id={`mail-command-${index}`}
            role="option"
            aria-selected={index === selected}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => execute(index)}
          >
            <span>{command.label}</span>
            <span className="command-detail">{command.detail}</span>
          </div>
        ))}
        {commands.length === 0 && <p role="status">{localized('No results found')}</p>}
      </div>
    </dialog>,
    document.body
  );
}
