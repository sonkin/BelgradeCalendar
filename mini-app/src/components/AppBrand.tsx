import WebApp from '@twa-dev/sdk';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  APP_CONTACT_HINT,
  APP_DEVELOPER_NAME,
  APP_DEVELOPER_TELEGRAM_URL,
  APP_GITHUB_URL,
  APP_IDEA_AUTHOR_NAME,
  APP_IDEA_AUTHOR_TELEGRAM_URL,
} from '../constants/appMeta';
import logoUrl from '../styles/logo.png';

function openTelegram(url: string, onDone: () => void) {
  WebApp.openTelegramLink(url);
  onDone();
}

function openExternal(url: string, onDone: () => void) {
  WebApp.openLink(url);
  onDone();
}

type InfoRowProps = {
  label: string;
  children: ReactNode;
};

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="app-brand__row">
      <span className="app-brand__label">{label}</span>
      <span className="app-brand__value">{children}</span>
    </div>
  );
}

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

  const close = () => setOpen(false);

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
        <div className="app-brand__popover" role="dialog" aria-label="О календаре">
          <InfoRow label="Идея Календаря:">
            <button
              type="button"
              className="app-brand__link"
              onClick={() => openTelegram(APP_IDEA_AUTHOR_TELEGRAM_URL, close)}
            >
              {APP_IDEA_AUTHOR_NAME}
            </button>
          </InfoRow>

          <InfoRow label="Разработал:">
            <button
              type="button"
              className="app-brand__link"
              onClick={() => openTelegram(APP_DEVELOPER_TELEGRAM_URL, close)}
            >
              {APP_DEVELOPER_NAME}
            </button>
          </InfoRow>

          <InfoRow label="GitHub репозиторий:">
            <button
              type="button"
              className="app-brand__link"
              onClick={() => openExternal(APP_GITHUB_URL, close)}
            >
              github.com/sonkin/BelgradeCalendar
            </button>
          </InfoRow>

          <p className="app-brand__hint muted">{APP_CONTACT_HINT}</p>
        </div>
      ) : null}
    </div>
  );
}
