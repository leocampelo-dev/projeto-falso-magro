/**
 * auth.js
 * Controle simples de acesso por senha.
 *
 * COMO ALTERAR A SENHA:
 * Basta trocar o valor de APP_PASSWORD abaixo.
 */

const APP_PASSWORD = 'FALSOMAGRO30';

const Auth = {
  checkPassword(value) {
    if (!value) return false;
    return value.trim().toUpperCase() === APP_PASSWORD.toUpperCase();
  },

  unlock() {
    Storage.setUnlocked();
  },

  isUnlocked() {
    return Storage.isUnlocked();
  },
};
