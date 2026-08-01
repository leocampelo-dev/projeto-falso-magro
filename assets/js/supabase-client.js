/**
 * supabase-client.js
 *
 * Único arquivo que fala diretamente com o Supabase (client SDK + Edge Functions).
 * O resto do app (auth.js, storage.js) usa os métodos deste objeto —
 * assim, nenhuma chamada Supabase fica espalhada pelo projeto.
 *
 * Depende de:
 *   - supabase-config.js (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
 *   - CDN https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 (expõe window.supabase)
 */

const _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

const SupabaseClient = {
  raw: _client,

  /* ---------- Sessão / autenticação ---------- */
  async getSession() {
    const { data, error } = await _client.auth.getSession();
    if (error) return null;
    return data.session;
  },

  onAuthStateChange(callback) {
    return _client.auth.onAuthStateChange((_event, session) => callback(session));
  },

  async signOut() {
    await _client.auth.signOut();
  },

  isSessionAdmin(session) {
    return !!session && session.user?.app_metadata?.role === 'admin';
  },

  /** Troca um código individual por uma sessão válida */
  async redeemAccessCode(code) {
    const { data, error } = await _client.functions.invoke('redeem-access-code', {
      body: { code },
    });

    if (error || !data || data.error) {
      return { ok: false, error: (data && data.error) || 'Código inválido ou acesso indisponível. Verifique o código e tente novamente.' };
    }

    return this._establishSession(data);
  },

  /** Troca o código de administrador por uma sessão com role admin */
  async adminLogin(code) {
    const { data, error } = await _client.functions.invoke('admin-login', {
      body: { code },
    });

    if (error || !data || data.error) {
      return { ok: false, error: (data && data.error) || 'Código inválido ou acesso indisponível.' };
    }

    return this._establishSession(data);
  },

  async _establishSession({ email, hashedToken }) {
    if (!email || !hashedToken) {
      return { ok: false, error: 'Não foi possível liberar o acesso agora. Tente novamente.' };
    }

    const { error } = await _client.auth.verifyOtp({
      token_hash: hashedToken,
      type: 'magiclink',
    });

    if (error) {
      return { ok: false, error: 'Não foi possível liberar o acesso agora. Tente novamente.' };
    }

    return { ok: true };
  },

  /* ---------- Perfil ---------- */
  async fetchProfile(userId) {
    const { data, error } = await _client.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async saveProfile(userId, fields) {
    const { error } = await _client.from('profiles').upsert({ id: userId, ...fields });
    if (error) throw error;
  },

  /* ---------- Metas ---------- */
  async fetchGoals(userId) {
    const { data, error } = await _client.from('goals').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },

  async saveGoals(userId, goals) {
    const { error } = await _client.from('goals').upsert({ user_id: userId, ...goals });
    if (error) throw error;
  },

  /* ---------- Check-ins ---------- */
  async fetchCheckins(userId) {
    const { data, error } = await _client
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('date_key', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async upsertCheckin(userId, entry) {
    const { error } = await _client
      .from('checkins')
      .upsert({ user_id: userId, ...entry }, { onConflict: 'user_id,date_key' });
    if (error) throw error;
  },

  /* ---------- Admin ---------- */
  async generateAccessCode(notes) {
    const { data, error } = await _client.functions.invoke('generate-access-code', {
      body: { notes: notes || null },
    });
    if (error || !data || data.error) throw new Error((data && data.error) || 'Falha ao gerar código.');
    return data.code;
  },

  async adminListClients() {
    const { data, error } = await _client.functions.invoke('admin-clients', {
      body: { action: 'list' },
    });
    if (error || !data || data.error) throw new Error((data && data.error) || 'Falha ao listar clientes.');
    return data.clients || [];
  },

  async adminSetClientStatus(accessCodeId, action) {
    const { data, error } = await _client.functions.invoke('admin-clients', {
      body: { action, accessCodeId },
    });
    if (error || !data || data.error) throw new Error((data && data.error) || 'Falha ao atualizar cliente.');
    return true;
  },

  async adminResetClient(accessCodeId) {
    const { data, error } = await _client.functions.invoke('admin-clients', {
      body: { action: 'reset', accessCodeId, confirmed: true },
    });
    if (error || !data || data.error) throw new Error((data && data.error) || 'Falha ao resetar progresso.');
    return true;
  },

  async adminDeleteClient(accessCodeId) {
    const { data, error } = await _client.functions.invoke('admin-clients', {
      body: { action: 'delete', accessCodeId, confirmed: true },
    });
    if (error || !data || data.error) throw new Error((data && data.error) || 'Falha ao excluir cliente.');
    return true;
  },
};
