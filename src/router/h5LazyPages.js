import { lazy } from 'react';

export const HomePage = lazy(() => import('../pages/HomePage'));
export const CategoryPage = lazy(() => import('../pages/CategoryPage'));
export const LoginPage = lazy(() => import('../pages/LoginPage'));
export const DetailPage = lazy(() => import('../pages/DetailPage'));
export const CartPage = lazy(() => import('../pages/CartPage'));
export const CreateOrderPage = lazy(() => import('../pages/CreateOrderPage'));
export const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
export const PayPage = lazy(() => import('../pages/PayPage'));
export const OrderListPage = lazy(() => import('../pages/OrderListPage'));
export const OrderDetailPage = lazy(() => import('../pages/OrderDetailPage'));
export const ProfilePage = lazy(() => import('../pages/ProfilePage'));
export const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
export const AddressPage = lazy(() => import('../pages/AddressPage'));
