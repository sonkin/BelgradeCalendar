import { Link } from 'react-router-dom';
import { saveListScrollPosition } from '../utils/scrollRestoration';

export function HomeHeaderActions() {
  return (
    <div className="layout__header-actions">
      <Link
        to="/events/new"
        className="btn btn--primary btn--small btn--create"
        onClick={saveListScrollPosition}
      >
        + Создать новое событие
      </Link>
      <Link
        to="/settings"
        className="btn btn--secondary btn--small btn--settings"
        onClick={saveListScrollPosition}
      >
        ⚙ Настройки
      </Link>
    </div>
  );
}
