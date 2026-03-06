import { Link } from 'react-router-dom';
import { StatusBadge, CategoryBadge, SeverityBar } from '../common/StatusBadge';

const IssueCard = ({ issue }) => {
  const { _id, category, aiCategory, aiSeverityScore, status, priority, imageUrl, description, location, createdAt } = issue;

  const displayCategory = aiCategory || category || 'other';
  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <Link
      to={`/issues/${_id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition group"
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${displayCategory} issue`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            📍
          </div>
        )}
        {/* Priority ribbon */}
        {(priority === 'CRITICAL' || priority === 'HIGH') && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${priority === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
            {priority}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {/* Category + Status row */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={displayCategory} />
          <StatusBadge status={status} />
        </div>

        {/* Description or fallback */}
        <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]">
          {description || `${displayCategory.replace('_', ' ')} issue reported`}
        </p>

        {/* Severity */}
        {aiSeverityScore != null && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Severity</p>
            <SeverityBar score={aiSeverityScore} />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-1 border-t border-gray-50 text-xs text-gray-400">
          <span>{dateLabel}</span>
          {location?.coordinates && (
            <span>
              {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default IssueCard;
