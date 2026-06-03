import { Link } from 'react-router-dom';
import { dismissStartParamDeepLink } from '../utils/startParam';

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
  backTo?: string;
  brand?: React.ReactNode;
  action?: React.ReactNode;
}

export function Layout({ title, children, backTo, brand, action }: LayoutProps) {
  const isHomeHeader = Boolean(brand && action);

  return (
    <div className="layout">
      <header className={`layout__header${title ? '' : ' layout__header--compact'}`}>
        <div
          className={`layout__header-row${isHomeHeader ? ' layout__header-row--home' : ''}`}
        >
          {backTo ? (
            <Link
              to={backTo}
              className="layout__back"
              onClick={() => {
                if (backTo === '/') {
                  dismissStartParamDeepLink();
                }
              }}
            >
              ← К списку всех событий
            </Link>
          ) : brand ? (
            <div className="layout__header-brand">{brand}</div>
          ) : (
            <span className="layout__back-spacer" />
          )}
          {action}
        </div>
        {title ? <h1 className="layout__title">{title}</h1> : null}
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
