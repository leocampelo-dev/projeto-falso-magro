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

  /**
   * Login padrão com e-mail + senha. Não depende de nenhuma Edge Function —
   * o Supabase Auth valida a senha no servidor dele.
   */
  async signInWithPassword(email, password) {
    const { error } = await _client.auth.signInWithPassword({ email, password });
    if (error) {
      // Mensagem genérica de propósito: não confirma se o e-mail existe ou
      // não, só que a combinação e-mail+senha não bateu.
      return { ok: false, error: 'E-mail ou senha incorretos.' };
    }
    return { ok: true };
  },

  /**
   * Dispara o e-mail de redefinição de senha via nossa Edge Function
   * (request-password-reset), que usa Resend — mesmo canal já usado pra
   * outros e-mails transacionais do projeto. Não usa o e-mail nativo do
   * Supabase (exigiria SMTP customizado pra ser editável e tem rate limit
   * baixo por padrão).
   */
  async requestPasswordReset(email) {
    const { data, error } = await _client.functions.invoke('request-password-reset', {
      body: { email },
    });
    if (error) {
      // Mesmo assim não expomos detalhe nenhum ao usuário.
      return { ok: true };
    }
    return { ok: true, message: data?.message };
  },

  /** Consome o token_hash do e-mail de redefinição e estabelece sessão temporária */
  async verifyPasswordRecovery(tokenHash) {
    const { error } = await _client.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    if (error) {
      return { ok: false, error: 'Link inválido ou expirado. Peça uma nova redefinição de senha.' };
    }
    return { ok: true };
  },

  /** Define a nova senha (chamado depois de verifyPasswordRecovery estabelecer sessão) */
  async updatePassword(newPassword) {
    const { data, error } = await _client.auth.updateUser({ password: newPassword });
    if (error || !data?.user) {
      return { ok: false, error: 'Não foi possível salvar a nova senha. Tente novamente.' };
    }
    // Marca password_set_at, cobrindo também quem ainda estava no fluxo
    // antigo (magic link) e nunca tinha essa coluna preenchida.
    await _client
      .from('profiles')
      .update({ password_set_at: new Date().toISOString() })
      .eq('id', data.user.id);
    return { ok: true };
  },

  isSessionAdmin(session) {
    return !!session && session.user?.app_metadata?.role === 'admin';
  },

  /** Confirma no servidor se o acesso do usuário logado continua ativo (não bloqueado/expirado) */
  async checkAccessStatus() {
    const { data, error } = await _client.functions.invoke('check-access-status', {});
    if (error || !data) return { status: 'unknown' };
    return data;
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

  /**
   * Libera acesso manual pra um cliente pelo e-mail real dele — sem gerar
   * código nenhum. O cliente usa o /ativar de sempre com esse e-mail.
   * Substitui generateAccessCode como via principal de suporte manual.
   */
  async adminGrantAccess(email, notes) {
    const { data, error } = await _client.functions.invoke('admin-grant-access', {
      body: { email, notes: notes || null },
    });
    if (error || !data || data.error) throw new Error((data && data.error) || 'Falha ao liberar acesso.');
    return data;
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
