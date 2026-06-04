/** 分类名拆成两行展示（每行约两字），便于左侧竖条贴纸按钮排版。 */
export const splitCategoryLabel = (name) => {
  const text = String(name || '').trim();
  if (!text) {
    return { line1: '', line2: '' };
  }

  if (text.length <= 4) {
    const mid = Math.ceil(text.length / 2);
    return { line1: text.slice(0, mid), line2: text.slice(mid) };
  }

  if (text.length <= 6) {
    const mid = Math.ceil(text.length / 2);
    return { line1: text.slice(0, mid), line2: text.slice(mid) };
  }

  const mid = Math.floor(text.length / 2);
  return { line1: text.slice(0, mid), line2: text.slice(mid) };
};
