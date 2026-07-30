/**
 * storage.js
 * Camada única de acesso ao LocalStorage.
 * Nenhum outro arquivo deve chamar localStorage diretamente —
 * tudo passa por aqui para facilitar manutenção.
 */

const STORAGE_KEYS = {
  UNLOCKED: 'fm_unlocked',
  USER: 'fm_user',
  GOALS: 'fm_goals',
  CHECKINS: 'fm_checkins',
};

const Storage = {
  /* ---------- Acesso genérico ---------- */
  _get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error(`Erro ao ler "${key}" do LocalStorage`, err);
      return fallback;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Erro ao salvar "${key}" no LocalStorage`, err);
      return false;
    }
  },

  /* ---------- Acesso liberado ao app (senha) ---------- */
  isUnlocked() {
    return this._get(STORAGE_KEYS.UNLOCKED, false) === true;
  },

  setUnlocked() {
    return this._set(STORAGE_KEYS.UNLOCKED, true);
  },

  /* ---------- Usuário ---------- */
  getUser() {
    return this._get(STORAGE_KEYS.USER, null);
  },

  saveUser(user) {
    return this._set(STORAGE_KEYS.USER, user);
  },

  hasUser() {
    const user = this.getUser();
    return !!(user && user.name && user.startDate);
  },

  /* ---------- Metas calculadas ---------- */
  getGoals() {
    return this._get(STORAGE_KEYS.GOALS, null);
  },

  saveGoals(goals) {
    return this._set(STORAGE_KEYS.GOALS, goals);
  },

  hasGoals() {
    return !!this.getGoals();
  },

  /* ---------- Check-ins diários ---------- */
  getCheckins() {
    return this._get(STORAGE_KEYS.CHECKINS, []);
  },

  saveCheckin(entry) {
    const checkins = this.getCheckins();
    const existingIndex = checkins.findIndex((c) => c.dateKey === entry.dateKey);

    if (existingIndex >= 0) {
      checkins[existingIndex] = entry;
    } else {
      checkins.push(entry);
    }

    checkins.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return this._set(STORAGE_KEYS.CHECKINS, checkins);
  },

  getCheckinByDateKey(dateKey) {
    return this.getCheckins().find((c) => c.dateKey === dateKey) || null;
  },

  getLastCheckin() {
    const checkins = this.getCheckins();
    return checkins.length ? checkins[checkins.length - 1] : null;
  },

  /* ---------- Utilidades ---------- */
  clearAll() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
