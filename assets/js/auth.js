/**
 * auth.js
 * Autenticação por código individual (Supabase Auth), sem senha universal.
 *
 * Nenhum código — nem de cliente, nem de administrador — é validado aqui.
 * A validação acontece sempre no backend (Edge Functions redeem-access-code
 * e admin-login), que são as únicas que sabem se um código é válido.
 * Este arquivo só orquestra a chamada e guarda o resultado da sessão.
 */

const Auth = {
  _session: null,

  /** Sessão atual em memória (populada por refreshSession) */
  getSession() {
    return this._session;
  },

  isAuthenticated() {
    return !!this._session;
  },

  isAdmin() {
    return SupabaseClient.isSessionAdmin(this._session);
  },

  getUserId() {
    return this._session?.user?.id || null;
  },

  /** Busca a sessão persistida (se o usuário já tinha entrado antes neste navegador) */
  async refreshSession() {
    this._session = await SupabaseClient.getSession();
    return this._session;
  },

  /** Troca o código individual do cliente por uma sessão válida */
  async redeemAccessCode(code) {
    const result = await SupabaseClient.redeemAccessCode(code);
    if (result.ok) {
      await this.refreshSession();
    }
    return result;
  },

  /** Troca o código de administrador por uma sessão com privilégios de admin */
  async adminLogin(code) {
    const result = await SupabaseClient.adminLogin(code);
    if (result.ok) {
      await this.refreshSession();
    }
    return result;
  },

  async signOut() {
    await SupabaseClient.signOut();
    this._session = null;
    Storage.clearAll();
  },
};
