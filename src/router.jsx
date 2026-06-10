import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import H5Shell from './components/h5/H5Shell';
import AdminShell from './components/admin/AdminShell';
import { RequireAdminAuth, RequirePermission } from './components/admin/PermissionGate';
import { h5Routes } from './router/h5Routes';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';

const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        Component: H5Shell,
        children: h5Routes,
      },
      {
        path: 'admin/login',
        Component: AdminLoginPage,
      },
      {
        path: 'admin',
        element: (
          <RequireAdminAuth>
            <AdminShell />
          </RequireAdminAuth>
        ),
        children: [
          {
            index: true,
            element: (
              <RequirePermission permission="dashboard:view">
                <AdminDashboardPage />
              </RequirePermission>
            ),
          },
          {
            path: 'analytics',
            element: (
              <RequirePermission permission="analytics:view">
                <AdminAnalyticsPage />
              </RequirePermission>
            ),
          },
          {
            path: 'products',
            element: (
              <RequirePermission permission="products:view">
                <AdminProductsPage />
              </RequirePermission>
            ),
          },
          {
            path: 'categories',
            element: (
              <RequirePermission permission="categories:view">
                <AdminCategoriesPage />
              </RequirePermission>
            ),
          },
          {
            path: 'orders',
            element: (
              <RequirePermission permission="orders:view">
                <AdminOrdersPage />
              </RequirePermission>
            ),
          },
          {
            path: 'roles',
            element: (
              <RequirePermission permission="roles:view">
                <AdminRolesPage />
              </RequirePermission>
            ),
          },
        ],
      },
    ],
  },
]);

export default router;
