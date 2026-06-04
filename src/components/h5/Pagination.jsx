import Button from '../common/Button';

const Pagination = ({ page, totalPages, total, onPrev, onNext, className = '' }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={`pm-pagination ${className}`.trim()}
      aria-label="分页导航"
    >
      <Button type="button" variant="ghost" disabled={page <= 1} onClick={onPrev}>
        上一页
      </Button>
      <span className="pm-pagination-info">
        第 {page} / {totalPages} 页 · 共 {total} 条
      </span>
      <Button type="button" variant="ghost" disabled={page >= totalPages} onClick={onNext}>
        下一页
      </Button>
    </nav>
  );
};

export default Pagination;
