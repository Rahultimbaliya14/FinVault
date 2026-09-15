import Select from './Select';

// Generates a range of months centered on "now" - a couple months back
// (for reviewing recently-passed dues) through several months forward
// (for planning ahead, which is what was actually asked for).
const buildMonthOptions = (monthsBack = 2, monthsForward = 6) => {
  const now = new Date();
  const options = [];

  for (let offset = -monthsBack; offset <= monthsForward; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    options.push({
      value: `${d.getFullYear()}-${d.getMonth() + 1}`, // month is 1-indexed here to match the API
      label: offset === 0 ? `${label} (this month)` : label,
    });
  }
  return options;
};

// value/onChange work with a "YYYY-M" string so it plugs directly into
// the Select component's existing interface. Parent components split
// it back into { year, month } when calling the dues API.
const MonthSelector = ({ value, onChange }) => (
  <div style={{ maxWidth: '220px' }}>
    <Select name="month" value={value} onChange={onChange} options={buildMonthOptions()} />
  </div>
);

export default MonthSelector;