const EmptyState = ({ title, description, action, iconSrc }) => {
  return (
    <div className="pm-empty-state">
      <div className="pm-empty-icon">
        {iconSrc ? <img src={iconSrc} alt={title} /> : 'PM'}
      </div>
      <h3 className="pm-empty-title">{title}</h3>
      <p className="pm-empty-desc">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;