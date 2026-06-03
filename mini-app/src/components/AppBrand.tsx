import WebApp from '@twa-dev/sdk';
import { useEffect, useRef, useState } from 'react';
import logoUrl from '../styles/logo.png';
import { APP_AUTHOR_NAME, APP_AUTHOR_TELEGRAM_URL, APP_YEAR } from '../constants/appMeta';

export function AppBrand() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const openAuthor = () => {
    WebApp.openTelegramLink(APP_AUTHOR_TELEGRAM_URL);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="app-brand">
      <button
        type="button"
        className="app-brand__logo-btn"
        aria-label="О приложении"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <img src={logoUrl} alt="" className="app-brand__logo" width={52} height={55} />
      </button>
      {open ? (
        <div className="app-brand__popover" role="dialog" aria-label="Автор">
          <button type="button" className="app-brand__link" onClick={openAuthor}>
            {APP_AUTHOR_NAME}
          </button>
          <p className="app-brand__year muted">{APP_YEAR}</p>
        </div>
      ) : null}
    </div>
  );
}
