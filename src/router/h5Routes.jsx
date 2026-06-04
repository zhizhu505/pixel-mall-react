import RequireUserAuth from '../components/h5/RequireUserAuth';
import {
  AddressPage,
  CartPage,
  CategoryPage,
  CheckoutPage,
  CreateOrderPage,
  DetailPage,
  FavoritesPage,
  HomePage,
  LoginPage,
  OrderDetailPage,
  OrderListPage,
  PayPage,
  ProfilePage,
} from './h5LazyPages';

/** H5 商城前台路由（不含 Admin），页面懒加载 */
export const h5Routes = [
  { index: true, Component: HomePage },
  { path: 'home', Component: HomePage },
  { path: 'category', Component: CategoryPage },
  { path: 'login', Component: LoginPage },
  { path: 'detail/:goodId', Component: DetailPage },
  {
    element: <RequireUserAuth />,
    children: [
      { path: 'cart', Component: CartPage },
      { path: 'createOrder/:goodId', Component: CreateOrderPage },
      { path: 'checkout', Component: CheckoutPage },
      { path: 'pay/:orderId', Component: PayPage },
      { path: 'orderList', Component: OrderListPage },
      { path: 'orderDetail/:orderId', Component: OrderDetailPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'favorites', Component: FavoritesPage },
      { path: 'address', Component: AddressPage },
    ],
  },
];

export const h5RoutePaths = {
  home: '/home',
  category: '/category',
  cart: '/cart',
  profile: '/profile',
  login: '/login',
  orderList: '/orderList',
  favorites: '/favorites',
  address: '/address',
};
