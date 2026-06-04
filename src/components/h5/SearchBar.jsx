const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = '搜索像素好物...',
  className = '',
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form className={`pm-search ${className}`.trim()} onSubmit={handleSubmit}>
      <input
        aria-label="搜索商品"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button className="pm-btn pm-btn-primary" type="submit">
        搜索
      </button>
    </form>
  );
};

export default SearchBar;
