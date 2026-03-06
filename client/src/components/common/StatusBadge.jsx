/**
 * Reusable status and priority badge components.
 */

const STATUS_CONFIG = {
  PENDING:      { label: 'Pending',      cls: 'bg-yellow-100 text-yellow-800' },
  ACKNOWLEDGED: { label: 'Acknowledged', cls: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS:  { label: 'In Progress',  cls: 'bg-purple-100 text-purple-800' },
  RESOLVED:     { label: 'Resolved',     cls: 'bg-green-100 text-green-800' },
  REJECTED:     { label: 'Rejected',     cls: 'bg-red-100 text-red-800' },
  DUPLICATE:    { label: 'Duplicate',    cls: 'bg-gray-100 text-gray-800' },
};

const PRIORITY_CONFIG = {
  LOW:      { label: 'Low',      cls: 'bg-gray-100 text-gray-700' },
  MEDIUM:   { label: 'Medium',   cls: 'bg-yellow-100 text-yellow-700' },
  HIGH:     { label: 'High',     cls: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Critical', cls: 'bg-red-100 text-red-700 font-semibold' },
};

const CATEGORY_CONFIG = {
  pothole:    { label: 'Pothole',      icon: '🕳️', cls: 'bg-orange-100 text-orange-800' },
  road_damage:{ label: 'Road Damage',  icon: '🛣️', cls: 'bg-yellow-100 text-yellow-800' },
  garbage:    { label: 'Garbage',      icon: '🗑️', cls: 'bg-green-100 text-green-800' },
  other:      { label: 'Other',        icon: '📍', cls: 'bg-gray-100 text-gray-800' },
};

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

export const SeverityBar = ({ score }) => {
  const pct = Math.round((score ?? 0) * 100);
  const color =
    pct >= 90 ? 'bg-red-500' :
    pct >= 70 ? 'bg-orange-500' :
    pct >= 50 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
};

export { CATEGORY_CONFIG, STATUS_CONFIG };
export default StatusBadge;
