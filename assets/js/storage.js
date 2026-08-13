/**
 * storage.js
 * Camada híbrida de persistência.
 *
 *   Supabase     = fonte oficial dos dados
 *   LocalStorage = cache local / fallback offline
 *
 * API pública preservada do modelo anterior (mesmos nomes usados pelo
 * resto do app): getUser/saveUser/hasUser, getGoals/saveGoals/hasGoals,
 * getCheckins/saveCheckin/getCheckinByDateKey/getLastCheckin.
 *
 * NOVO (Falso Magro 30D — projeto personalizado):
 *   O objeto "user" agora também guarda a configuração do projeto
 *   (selectedDiet, selectedWorkout, cardioDays, cardioMinutes, cardioType,
 *   cardioCustomType, projectConfigured). Isso reaproveita o MESMO mecanismo
 *   de sync/offline que já existia para nome/data de início — nenhuma tabela
 *   nova foi criada, só colunas novas na tabela de perfil (ver migration
 *   0002_project_config.sql).
 *   Novas funções: hasProjectConfigured() e saveProjectConfig(partial).
 *
 * Leituras (getUser, getGoals, getCheckins etc.) continuam SÍNCRONAS: leem do cache local, que é
 * sincronizado com o Supabase uma vez no boot do app (Storage.syncFromRemote).
 * Escritas (saveUser, saveGoals, saveCheckin) são ASSÍNCRONAS: tentam gravar no Supabase primeiro;
 * se falhar (ex: offline), o dado é mantido no cache local e marcado
 * como "pendingSync" para nova tentativa quando a internet voltar.
 */

const STORAGE_KEYS = {
  USER: 'fm_user',
  GOALS: 'fm_goals',
  CHECKINS: 'fm_checkins',
  PENDING: 'fm_pending_sync',
};

let _currentUserId = null;

const Storage = {
  /* ---------- Acesso genérico ao cache local ---------- */
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

  /* ---------- Contexto do usuário autenticado ---------- */
  setUserId(userId) {
    _currentUserId = userId;
  },

  getUserId() {
    return _currentUserId;
  },

  /* ---------- Pendências de sincronização ---------- */
  _getPending() {
    return this._get(STORAGE_KEYS.PENDING, { user: false, goals: false, checkins: [] });
  },

  _setPending(pending) {
    this._set(STORAGE_KEYS.PENDING, pending);
  },

  hasPendingSync() {
    const p = this._getPending();
    return !!(p.user || p.goals || (p.checkins && p.checkins.length));
  },

  /* ---------- Sincronização inicial (boot) ---------- */
  /**
   * Busca profile/goals/checkins do Supabase e popula o cache local.
   * Se a busca falhar (ex: sem internet), mantém o que já existir no
   * cache local (fallback offline) e retorna { ok: false }.
   */
  async syncFromRemote(userId) {
    this.setUserId(userId);

    try {
      const [profile, goals, checkins] = await Promise.all([
        SupabaseClient.fetchProfile(userId),
        SupabaseClient.fetchGoals(userId),
        SupabaseClient.fetchCheckins(userId),
      ]);

      if (profile) {
        this._set(STORAGE_KEYS.USER, this._userFromDb(profile));
      }
      if (goals) {
        this._set(STORAGE_KEYS.GOALS, this._goalsFromDb(goals));
      } else {
        this._set(STORAGE_KEYS.GOALS, null);
      }
      this._set(STORAGE_KEYS.CHECKINS, checkins.map((c) => this._checkinFromDb(c)));

      return { ok: true };
    } catch (err) {
      console.error('Falha ao sincronizar com o Supabase — usando cache local', err);
      return { ok: false, error: err };
    }
  },

  /** Tenta reenviar dados marcados como pendentes (chamado quando a internet volta) */
  async syncPending() {
    if (!_currentUserId) return;
    const pending = this._getPending();
    let changed = false;

    if (pending.user) {
      const user = this.getUser();
      if (user) {
        try {
          await SupabaseClient.saveProfile(_currentUserId, this._userToDb(user));
          pending.user = false;
          changed = true;
        } catch (err) {
          console.warn('Ainda não foi possível sincronizar o perfil', err);
        }
      }
    }

    if (pending.goals) {
      const goals = this.getGoals();
      if (goals) {
        try {
          await SupabaseClient.saveGoals(_currentUserId, this._goalsToDb(goals));
          pending.goals = false;
          changed = true;
        } catch (err) {
          console.warn('Ainda não foi possível sincronizar as metas', err);
        }
      }
    }

    if (pending.checkins && pending.checkins.length) {
      const stillPending = [];
      for (const dateKey of pending.checkins) {
        const entry = this.getCheckinByDateKey(dateKey);
        if (!entry) continue;
        try {
          await SupabaseClient.upsertCheckin(_currentUserId, this._checkinToDb(entry));
          changed = true;
        } catch (err) {
          stillPending.push(dateKey);
        }
      }
      pending.checkins = stillPending;
    }

    if (changed) this._setPending(pending);
    return { ok: !this.hasPendingSync() };
  },

  /* ---------- Mapeamento de campos (camelCase local ↔ snake_case Supabase) ---------- */
  _userFromDb(row) {
    return {
      name: row.name,
      startDate: row.start_date,
      completionShown: !!row.completion_shown,
      selectedDiet: row.selected_diet || null,
      selectedWorkout: row.selected_workout || null,
      cardioDays: row.cardio_days || null,
      cardioMinutes: row.cardio_minutes || null,
      cardioType: row.cardio_type || null,
      cardioCustomType: row.cardio_custom_type || '',
      projectConfigured: !!row.project_configured,
      foodSwaps: row.food_swaps || {},
    };
  },
  _userToDb(user) {
    return {
      name: user.name,
      start_date: user.startDate,
      completion_shown: !!user.completionShown,
      selected_diet: user.selectedDiet || null,
      selected_workout: user.selectedWorkout || null,
      cardio_days: user.cardioDays || null,
      cardio_minutes: user.cardioMinutes || null,
      cardio_type: user.cardioType || null,
      cardio_custom_type: user.cardioCustomType || null,
      project_configured: !!user.projectConfigured,
      food_swaps: user.foodSwaps || {},
    };
  },

  _goalsFromDb(row) {
    return {
      tmb: row.tmb,
      get: row.get,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      water: row.water,
      input: row.input_data,
      calculatedAt: row.calculated_at,
    };
  },
  _goalsToDb(goals) {
    return {
      tmb: goals.tmb,
      get: goals.get,
      calories: goals.calories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat,
      water: goals.water,
      input_data: goals.input,
      calculated_at: goals.calculatedAt,
    };
  },

  _checkinFromDb(row) {
    return {
      dateKey: row.date_key,
      dayNumber: row.day_number,
      weight: row.weight,
      waterMl: row.water_ml,
      trained: row.trained,
      sleptWell: row.slept_well,
      energy: row.energy,
      nutrition: row.nutrition,
      didCardio: row.did_cardio,
      notes: row.notes,
      savedAt: row.saved_at,
    };
  },
  _checkinToDb(entry) {
    return {
      date_key: entry.dateKey,
      day_number: entry.dayNumber,
      weight: entry.weight,
      water_ml: entry.waterMl,
      trained: entry.trained,
      slept_well: entry.sleptWell,
      energy: entry.energy,
      nutrition: entry.nutrition,
      did_cardio: entry.didCardio,
      notes: entry.notes,
      saved_at: entry.savedAt,
    };
  },

  /* ---------- Usuário / perfil ---------- */
  getUser() {
    return this._get(STORAGE_KEYS.USER, null);
  },

  hasUser() {
    const user = this.getUser();
    return !!(user && user.name && user.startDate);
  },

  /** Sempre grava no cache local. Tenta gravar no Supabase; se falhar, marca pendingSync. */
  async saveUser(user) {
    this._set(STORAGE_KEYS.USER, user);

    if (!_currentUserId) return { ok: false, offline: true };

    try {
      await SupabaseClient.saveProfile(_currentUserId, this._userToDb(user));
      const pending = this._getPending();
      pending.user = false;
      this._setPending(pending);
      return { ok: true };
    } catch (err) {
      console.error('Falha ao salvar perfil no Supabase — mantido localmente como pendente', err);
      const pending = this._getPending();
      pending.user = true;
      this._setPending(pending);
      return { ok: false, offline: true };
    }
  },

  /* ---------- Projeto personalizado (dieta / treino / cardio) ---------- */
  /** true assim que o usuário concluiu o assistente de 4 passos pelo menos uma vez. */
  hasProjectConfigured() {
    const user = this.getUser();
    return !!(user && user.projectConfigured);
  },

  /**
   * Atualiza só os campos do projeto, preservando o resto do perfil
   * (nome, data de início, etc.) e reaproveitando o mesmo saveUser/sync
   * já existente. Usado pelo onboarding e, depois, pelos botões "Alterar".
   */
  async saveProjectConfig(partial) {
    const user = this.getUser() || {};
    const updated = { ...user, ...partial };
    return this.saveUser(updated);
  },

  /* ---------- Substituições de alimentos (item 9) ---------- */
  /** Mapa { alimentoOriginal: {food, qty} }. Nunca null — sempre objeto. */
  getFoodSwaps() {
    const user = this.getUser();
    return (user && user.foodSwaps) || {};
  },

  /**
   * {food, qty} que deve aparecer no lugar de `originalFood` hoje, se
   * houver troca. Defensivo contra dado salvo ANTES desta versão (quando
   * a troca era só um texto solto, ex: "Claras (dobro da quantidade)") —
   * se o valor salvo não tiver o formato {food, qty} esperado, trata como
   * "sem troca" em vez de quebrar a tela mostrando "undefined".
   */
  getFoodSwap(originalFood) {
    const swap = this.getFoodSwaps()[originalFood];
    if (!swap || typeof swap !== 'object' || !swap.food || !swap.qty) return null;
    return swap;
  },

  /** `chosen` é {food, qty} — a substituição inteira, não só o nome. */
  async setFoodSwap(originalFood, chosen) {
    const user = this.getUser() || {};
    const foodSwaps = { ...(user.foodSwaps || {}), [originalFood]: chosen };
    return this.saveUser({ ...user, foodSwaps });
  },

  async clearFoodSwap(originalFood) {
    const user = this.getUser() || {};
    const foodSwaps = { ...(user.foodSwaps || {}) };
    delete foodSwaps[originalFood];
    return this.saveUser({ ...user, foodSwaps });
  },

  /* ---------- Metas calculadas ---------- */
  getGoals() {
    return this._get(STORAGE_KEYS.GOALS, null);
  },

  hasGoals() {
    return !!this.getGoals();
  },

  async saveGoals(goals) {
    this._set(STORAGE_KEYS.GOALS, goals);

    if (!_currentUserId) return { ok: false, offline: true };

    try {
      await SupabaseClient.saveGoals(_currentUserId, this._goalsToDb(goals));
      const pending = this._getPending();
      pending.goals = false;
      this._setPending(pending);
      return { ok: true };
    } catch (err) {
      console.error('Falha ao salvar metas no Supabase — mantidas localmente como pendentes', err);
      const pending = this._getPending();
      pending.goals = true;
      this._setPending(pending);
      return { ok: false, offline: true };
    }
  },

  /* ---------- Check-ins diários ---------- */
  getCheckins() {
    return this._get(STORAGE_KEYS.CHECKINS, []);
  },

  async saveCheckin(entry) {
    const checkins = this.getCheckins();
    const existingIndex = checkins.findIndex((c) => c.dateKey === entry.dateKey);

    if (existingIndex >= 0) {
      checkins[existingIndex] = entry;
    } else {
      checkins.push(entry);
    }

    checkins.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    this._set(STORAGE_KEYS.CHECKINS, checkins);

    if (!_currentUserId) return { ok: false, offline: true };

    try {
      await SupabaseClient.upsertCheckin(_currentUserId, this._checkinToDb(entry));
      const pending = this._getPending();
      pending.checkins = (pending.checkins || []).filter((d) => d !== entry.dateKey);
      this._setPending(pending);
      return { ok: true };
    } catch (err) {
      console.error('Falha ao salvar check-in no Supabase — mantido localmente como pendente', err);
      const pending = this._getPending();
      pending.checkins = pending.checkins || [];
      if (!pending.checkins.includes(entry.dateKey)) pending.checkins.push(entry.dateKey);
      this._setPending(pending);
      return { ok: false, offline: true };
    }
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
    _currentUserId = null;
  },
};
