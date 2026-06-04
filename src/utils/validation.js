export const validateRequired = (value, label) => {
  if (!String(value ?? '').trim()) {
    return `${label}不能为空`;
  }
  return '';
};

export const validatePhone = (phone) => {
  const normalized = String(phone ?? '').trim();
  if (!/^1\d{10}$/.test(normalized)) {
    return '请输入 11 位有效手机号';
  }
  return '';
};

export const validatePassword = (password, minLength = 6) => {
  if (String(password).length < minLength) {
    return `密码至少 ${minLength} 位`;
  }
  return '';
};

export const validateUsername = (username) => {
  const normalized = String(username ?? '').trim();
  if (normalized.length < 3) {
    return '用户名至少 3 个字符';
  }
  return '';
};

export const collectErrors = (entries) => {
  const errors = {};
  entries.forEach(([field, message]) => {
    if (message) {
      errors[field] = message;
    }
  });
  return errors;
};
