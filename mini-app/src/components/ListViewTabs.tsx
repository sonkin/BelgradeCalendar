import type { ListViewMode } from '../utils/listView';

const TABS: { id: ListViewMode; label: string }[] = [
  { id: 'full', label: 'Полный' },
  { id: 'compact', label: 'Краткий' },
  { id: 'monthly', label: 'По месяцам' },
];

interface ListViewTabsProps {
  mode: ListViewMode;
  onChange: (mode: ListViewMode) => void;
}

export function ListViewTabs({ mode, onChange }: ListViewTabsProps) {
  return (
    <div className="list-view-tabs" role="tablist" aria-label="Режим отображения списка">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={mode === tab.id}
          className={`list-view-tabs__btn${mode === tab.id ? ' list-view-tabs__btn--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
