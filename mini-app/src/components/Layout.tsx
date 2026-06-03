import { Link } from 'react-router-dom';
import { dismissStartParamDeepLink } from '../utils/startParam';

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
  backTo?: string;
  action?: React.ReactNode;
}

export function Layout({ title, children, backTo, action }: LayoutProps) {
  return (
    <div className="layout">
      <header className={`layout__header${title ? '' : ' layout__header--compact'}`}>
        <div className="layout__header-row">
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
