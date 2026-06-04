import { createContext } from 'react';
import addressService from '../services/addressService';
import adminService from '../services/adminService';
import cartService from '../services/cartService';
import favoriteService from '../services/favoriteService';
import goodService from '../services/goodService';
import orderService from '../services/orderService';
import userService from '../services/userService';

const ServiceContext = createContext();

const ServiceProvider = ({ children }) => {
  const value = {
    admin: adminService,
    good: goodService,
    order: orderService,
    user: userService,
    cart: cartService,
    favorite: favoriteService,
    address: addressService,
  };

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
};

export { ServiceContext, ServiceProvider };
