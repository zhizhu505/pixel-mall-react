import { defaultAddresses } from '../mock/data';
import { cloneValue, loadFromStorage, saveToStorage } from '../utils/storage';

const ADDRESS_KEY = 'pixelMall:addresses';

const normalizeText = (value) => String(value ?? '').trim();

class AddressService {
  list = [];

  revision = 0;

  constructor() {
    this._loadData();
  }

  getRevision() {
    return this.revision;
  }

  getAddressesByUser(userId) {
    return this.list
      .filter((item) => item.userId === Number(userId))
      .sort((left, right) => Number(right.isDefault) - Number(left.isDefault))
      .map((item) => cloneValue(item));
  }

  getDefaultAddress(userId) {
    const addresses = this.getAddressesByUser(userId);
    return addresses.find((item) => item.isDefault) || addresses[0] || null;
  }

  getAddressById(id) {
    const key = String(id);
    const item = this.list.find((entry) => String(entry.id) === key);
    return item ? cloneValue(item) : null;
  }

  addAddress(userId, input) {
    const numericUserId = Number(userId);
    const existingForUser = this.list.filter((item) => item.userId === numericUserId);
    const shouldDefault = Boolean(input.isDefault) || existingForUser.length === 0;

    const address = this._normalizeAddress({
      ...input,
      id: input.id || `addr-${Date.now()}`,
      userId: numericUserId,
      isDefault: shouldDefault,
    });

    if (address.isDefault) {
      this._clearDefault(numericUserId);
    }

    this.list.unshift(address);
    this._saveData();
    return cloneValue(address);
  }

  updateAddress(userId, input) {
    const index = this.list.findIndex((item) => item.id === input.id && item.userId === Number(userId));

    if (index < 0) {
      return null;
    }

    if (input.isDefault) {
      this._clearDefault(userId);
    }

    const address = this._normalizeAddress({
      ...this.list[index],
      ...input,
      userId: Number(userId),
    });

    this.list[index] = address;
    this._saveData();
    return cloneValue(address);
  }

  deleteAddress(userId, id) {
    const before = this.list.length;
    this.list = this.list.filter((item) => !(item.id === id && item.userId === Number(userId)));

    if (this.list.length === before) {
      return false;
    }

    const remaining = this.list.filter((item) => item.userId === Number(userId));
    if (remaining.length && !remaining.some((item) => item.isDefault)) {
      const nextDefaultId = remaining[0].id;
      this.list = this.list.map((item) =>
        item.id === nextDefaultId && item.userId === Number(userId)
          ? { ...item, isDefault: true }
          : item,
      );
    }

    this._saveData();
    return true;
  }

  setDefaultAddress(userId, id) {
    this._clearDefault(userId);
    const address = this.list.find((item) => item.id === id && item.userId === Number(userId));

    if (!address) {
      return null;
    }

    address.isDefault = true;
    this._saveData();
    return cloneValue(address);
  }

  _clearDefault(userId) {
    this.list = this.list.map((item) =>
      item.userId === Number(userId) ? { ...item, isDefault: false } : item,
    );
  }

  _normalizeAddress(input) {
    return {
      id: input.id,
      userId: Number(input.userId),
      receiver: normalizeText(input.receiver),
      phone: normalizeText(input.phone),
      detail: normalizeText(input.detail),
      isDefault: Boolean(input.isDefault),
    };
  }

  _loadData() {
    const stored = loadFromStorage([ADDRESS_KEY], defaultAddresses);
    this.list = stored.map((item) => this._normalizeAddress(item));
    this._saveData();
  }

  _saveData() {
    this.revision += 1;
    saveToStorage(ADDRESS_KEY, this.list);
  }
}

const addressService = new AddressService();
export default addressService;
