import { defaultUsers } from '../mock/data';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const USER_LIST_KEY = 'pixelMall:users';
const CURRENT_USER_KEY = 'pixelMall:currentUser';

class UserService {
  users = [];
  currentUser = null;

  constructor() {
    this._loadData();
  }

  getCurrentUser() {
    return this.currentUser ? cloneValue(this.currentUser) : null;
  }

  getUserById(id) {
    const user = this.users.find((item) => item.id === Number(id));
    return user ? cloneValue(user) : null;
  }

  login(username, password) {
    const user = this.users.find((item) => item.username === username && item.password === password);

    if (!user) {
      return { success: false, message: '账号或密码错误。' };
    }

    this.currentUser = { id: user.id, username: user.username, nickname: user.nickname };
    saveToStorage(CURRENT_USER_KEY, this.currentUser);
    return { success: true, user: this.getCurrentUser() };
  }

  register(payload) {
    const exists = this.users.some((item) => item.username === payload.username);

    if (exists) {
      return { success: false, message: '用户名已存在。' };
    }

    const user = {
      id: this.users.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      username: payload.username,
      password: payload.password,
      nickname: payload.nickname || payload.username,
    };

    this.users.push(user);
    saveToStorage(USER_LIST_KEY, this.users);
    this.currentUser = { id: user.id, username: user.username, nickname: user.nickname };
    saveToStorage(CURRENT_USER_KEY, this.currentUser);
    return { success: true, user: this.getCurrentUser() };
  }

  logout() {
    this.currentUser = null;
    saveToStorage(CURRENT_USER_KEY, null);
  }

  _loadData() {
    this.users = loadFromStorage([USER_LIST_KEY], defaultUsers);
    this.currentUser = loadFromStorage([CURRENT_USER_KEY], null);
    saveToStorage(USER_LIST_KEY, this.users);
  }
}

const userService = new UserService();
export default userService;
