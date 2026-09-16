import Select from './Select';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Reports look back more than the dashboard's "near now" picker does -
// covers the last 3 years through next year, since someone might want
// last year's tax-season numbers, not just recent months.
const buildYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
};

const MONTH_OPTIONS = MONTHS.map((m, i) => ({ value: String(i + 1), label: m }));

const ReportMonthPicker = ({ month, year, onChangeMonth, onChangeYear }) => (
  <div className="d-flex gap-2">
    <div style={{ width: '160px' }}>
      <Select
        name="reportMonth"
        value={String(month)}
        onChange={(e) => onChangeMonth(Number(e.target.value))}
        options={MONTH_OPTIONS}
      />
    </div>
    <div style={{ width: '110px' }}>
      <Select
        name="reportYear"
        value={String(year)}
        onChange={(e) => onChangeYear(Number(e.target.value))}
        options={buildYearOptions()}
      />
    </div>
  </div>
);

export default ReportMonthPicker;