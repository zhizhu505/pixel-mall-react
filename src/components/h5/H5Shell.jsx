import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import BottomBar from './BottomBar';

const HIDDEN_BOTTOM_BAR_PATHS = ['/login', '/admin/login'];

const H5Shell = () => {
  const { pathname } = useLocation();
  const hideBottomBar = HIDDEN_BOTTOM_BAR_PATHS.some((path) => pathname.startsWith(path));

  return (
    <div className="pm-h5-viewport">
      <div className="pm-h5-shell">
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
      </div>
    </div>
  );
};

export default H5Shell;
