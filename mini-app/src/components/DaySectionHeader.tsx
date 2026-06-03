import { getDateDisplay } from '../utils/dates';

interface DaySectionHeaderProps {
  startsAt: string;
}

export function DaySectionHeader({ startsAt }: DaySectionHeaderProps) {
  const { weekdayDate, relative } = getDateDisplay(startsAt);

  return (
    <header className="day-section__header">
      <h2 className="day-section__date">{weekdayDate}</h2>
      <p className="day-section__relative">{relative}</p>
    </header>
  );
}
