import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import Button from '../components/common/Button';
import { useServices } from '../hooks/useServices';
import {
  collectErrors,
  validatePassword,
  validateRequired,
  validateUsername,
} from '../utils/validation';

const LoginPage = () => {
  const { user } = useServices();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const redirect = searchParams.get('redirect') || '/home';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode) => {
    const next = new URLSearchParams(searchParams);
    if (nextMode === 'register') {
      next.set('mode', 'register');
    } else {
      next.delete('mode');
    }
    navigate(`/login?${next.toString()}`, { replace: true });
    setErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const fieldErrors = collectErrors([
      ['username', validateUsername(username)],
      ['password', mode === 'register' ? validatePassword(password) : validateRequired(password, '密码')],
      ['nickname', mode === 'register' ? validateRequired(nickname, '昵称') : ''],
    ]);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length) {
      return;
    }

    setSubmitting(true);
    const result =
      mode === 'register'
        ? user.register({ username: username.trim(), password, nickname: nickname.trim() })
        : user.login(username.trim(), password);

    setSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.message });
      return;
    }

    navigate(decodeURIComponent(redirect), { replace: true });
  };

  return (
    <main className="pm-page pm-login-page">
      <section className="pm-login-panel">
        <h1 className="pm-login-title">{mode === 'register' ? '注册账号' : '用户登录'}</h1>
        <div className="pm-login-switch">
          <button
            type="button"
            className={`pm-btn pm-btn-ghost${mode === 'login' ? ' is-active' : ''}`}
            onClick={() => switchMode('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={`pm-btn pm-btn-ghost${mode === 'register' ? ' is-active' : ''}`}
            onClick={() => switchMode('register')}
          >
            注册
          </button>
        </div>

        <form className="pm-login-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' ? (
            <div className="pm-control">
              <label className="pm-label" htmlFor="nickname">昵称</label>
              <input
                id="nickname"
                className="pm-input"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
              />
              {errors.nickname ? <p className="pm-help has-error">{errors.nickname}</p> : null}
            </div>
          ) : null}
          <div className="pm-control">
            <label className="pm-label" htmlFor="username">用户名</label>
            <input
              id="username"
              className="pm-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            {errors.username ? <p className="pm-help has-error">{errors.username}</p> : null}
          </div>
          <div className="pm-control">
            <label className="pm-label" htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              className="pm-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password ? <p className="pm-help has-error">{errors.password}</p> : null}
          </div>
          {errors.form ? <p className="pm-help has-error">{errors.form}</p> : null}
          <Button type="submit" variant="primary" block disabled={submitting}>
            {submitting ? '提交中...' : mode === 'register' ? '注册并登录' : '登录'}
          </Button>
        </form>

        <p className="pm-help">
          演示账号：shopper / shopper123
          <br />
          <Link to="/home">返回首页</Link>
        </p>
      </section>
    </main>
  );
};

export default LoginPage;
