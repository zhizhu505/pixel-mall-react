import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import BottomBar from './BottomBar';
import { PIXEL_TOAST_EVENT } from '../../utils/pixelToast';

const HIDDEN_BOTTOM_BAR_PATHS = ['/login', '/admin/login'];

const H5Shell = () => {
  const { pathname } = useLocation();
  const hideBottomBar = HIDDEN_BOTTOM_BAR_PATHS.some((path) => pathname.startsWith(path));
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    const handleToast = (event) => {
      const detail = event.detail || {};
      if (!detail.message) {
        return;
      }

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      setToast({
        id: Date.now(),
        message: detail.message,
        tone: detail.tone || 'warning',
      });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, detail.duration || 2000);
    };

    window.addEventListener(PIXEL_TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(PIXEL_TOAST_EVENT, handleToast);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="pm-h5-viewport">
      <div className="pm-h5-shell">
        <div className="pm-h5-status-bar" aria-label="手机状态栏">
          <span className="pm-h5-status-time">9:41</span>
          <span className="pm-h5-dynamic-island" aria-hidden />
          <span className="pm-h5-status-icons" aria-hidden>
            <span className="pm-h5-signal">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="pm-h5-wifi" />
            <span className="pm-h5-battery">
              <span className="pm-h5-battery-fill" />
            </span>
          </span>
        </div>
        {toast ? (
          <div
            className={`pm-pixel-toast pm-pixel-toast-${toast.tone}`}
            key={toast.id}
            role="status"
            aria-live="polite"
          >
            <span className="pm-pixel-toast-icon" aria-hidden />
            <span>{toast.message}</span>
          </div>
        ) : null}
        <div className="pm-h5-main">
          <Suspense
            fallback={
              <main className="pm-page">
                <p className="pm-help">页面加载中...</p>
              </main>
            }
          >
            <Outlet />
          </Suspense>
        </div>
        {!hideBottomBar ? <BottomBar /> : null}
        <div className="pm-h5-home-indicator" aria-hidden />
      </div>
    </div>
  );
};

export default H5Shell;
