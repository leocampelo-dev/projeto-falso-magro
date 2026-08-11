/**
 * dashboard.js
 * Renderiza a Home: saudação, cabeçalho do projeto (Dia X/30), "Seu Plano"
 * (dieta/treino/cardio com botão Alterar), card de status "Hoje" (check-in
 * feito/pendente + contador semanal de cardio) e o checklist dinâmico de
 * passos original. Metas, anel de progresso e estatísticas completas ficam
 * na aba Progresso (progress.js) — aqui é só o resumo do dia.
 */

const CHALLENGE_LENGTH_DAYS = 30;

const Dashboard = {
  render() {
    const user = Storage.getUser();
    if (!user) return;

    const currentDay = Utils.getCurrentChallengeDay(user.startDate);
    const isComplete = currentDay > CHALLENGE_LENGTH_DAYS;

    this._renderGreeting(user.name);
    this._renderGoalsStep();
    this._renderCheckinStep();

    // [NOVO — Fase 5] Home personalizada
    this._renderProjectHeader(user, currentDay);
    this._renderPlanCard(user);
    this._bindPlanActions();
    this._renderTodayChecklist();

    if (isComplete && !user.completionShown) {
      user.completionShown = true;
      Storage.saveUser(user);
      App.showCompletionScreen();
    }
  },

  _renderGreeting(name) {
    const el = document.getElementById('dashGreeting');
    if (el) el.textContent = `Olá, ${name} 👋`;
  },

  /** [NOVO] "🔥 Projeto Falso Magro 30D" + "Dia X de 30" + barra de progresso */
  _renderProjectHeader(user, currentDay) {
    const dayLabel = document.getElementById('projectDayLabel');
    const fill = document.getElementById('projectProgressFill');
    if (!dayLabel && !fill) return; // Home ainda não tem os elementos novos no HTML

    const clampedDay = Math.min(Math.max(currentDay, 1), CHALLENGE_LENGTH_DAYS);
    if (dayLabel) dayLabel.textContent = `Dia ${clampedDay} de ${CHALLENGE_LENGTH_DAYS}`;
    if (fill) fill.style.width = `${Math.round((clampedDay / CHALLENGE_LENGTH_DAYS) * 100)}%`;
  },

  /** [NOVO] Card "🎯 Seu Plano" — dieta / treino / cardio escolhidos no onboarding */
  _renderPlanCard(user) {
    const goals = Storage.getGoals();

    // Alimentação
    const dietValueEl = document.getElementById('planDietValue');
    const dietMacrosEl = document.getElementById('planDietMacros');
    if (user.selectedDiet && goals) {
      const kcal = Number(user.selectedDiet);
      const macros = Calculator.calculateMacrosForTarget(kcal, goals.protein);
      if (dietValueEl) dietValueEl.textContent = `${kcal} kcal`;
      if (dietMacrosEl) {
        dietMacrosEl.textContent = `Proteína ${macros.protein}g · Carboidratos ${macros.carbs}g · Gorduras ${macros.fat}g`;
      }
    } else {
      if (dietValueEl) dietValueEl.textContent = 'Não configurado';
      if (dietMacrosEl) dietMacrosEl.textContent = '';
    }

    // Treino
    const workoutValueEl = document.getElementById('planWorkoutValue');
    if (workoutValueEl) {
      const workoutOpt = WORKOUT_OPTIONS.find((w) => w.value === user.selectedWorkout);
      workoutValueEl.textContent = workoutOpt ? `${workoutOpt.desc} — ${workoutOpt.label}` : 'Não configurado';
    }

    // Cardio
    const cardioValueEl = document.getElementById('planCardioValue');
    if (cardioValueEl) {
      if (user.cardioDays && user.cardioMinutes) {
        const typeOpt = CARDIO_TYPE_OPTIONS.find((t) => t.value === user.cardioType);
        const typeLabel = user.cardioType === 'outro' ? (user.cardioCustomType || 'Outro') : (typeOpt || {}).label;
        cardioValueEl.textContent = `${user.cardioDays}x/semana · ${user.cardioMinutes} min · ${typeLabel || '—'}`;
      } else {
        cardioValueEl.textContent = 'Não configurado';
      }
    }
  },

  /** [NOVO] Liga os botões "Ver alimentação" e "Alterar" do card do plano.
   *  Usa dataset.bound pra não duplicar o listener a cada render(). */
  _bindPlanActions() {
    const viewBtn = document.getElementById('planDietViewBtn');
    const detailsEl = document.getElementById('planDietDetails');
    if (viewBtn && detailsEl && !viewBtn.dataset.bound) {
      viewBtn.dataset.bound = 'true';
      viewBtn.addEventListener('click', () => {
        const user = Storage.getUser();
        if (!user || !user.selectedDiet) return;

        const isOpen = detailsEl.style.display !== 'none';
        if (isOpen) {
          detailsEl.style.display = 'none';
          viewBtn.textContent = 'Ver alimentação';
          return;
        }

        const model = DietModels.get(Number(user.selectedDiet));
        detailsEl.innerHTML = model ? DietModels.renderHtml(model) : '<p>Modelo não encontrado.</p>';
        detailsEl.style.display = '';
        viewBtn.textContent = 'Ocultar alimentação';
      });
    }

    const dietChangeBtn = document.getElementById('planDietChangeBtn');
    if (dietChangeBtn && !dietChangeBtn.dataset.bound) {
      dietChangeBtn.dataset.bound = 'true';
      dietChangeBtn.addEventListener('click', () => Onboarding.startAt('diet'));
    }

    // [NOVO] "Ver treino" — mesmo padrão do "Ver alimentação", reaproveitando
    // o conteúdo de GUIDE_WORKOUTS (guide-content.js) via renderWorkoutHtml().
    const workoutViewBtn = document.getElementById('planWorkoutViewBtn');
    const workoutDetailsEl = document.getElementById('planWorkoutDetails');
    if (workoutViewBtn && workoutDetailsEl && !workoutViewBtn.dataset.bound) {
      workoutViewBtn.dataset.bound = 'true';
      workoutViewBtn.addEventListener('click', () => {
        const user = Storage.getUser();
        if (!user || !user.selectedWorkout) return;

        const isOpen = workoutDetailsEl.style.display !== 'none';
        if (isOpen) {
          workoutDetailsEl.style.display = 'none';
          workoutViewBtn.textContent = 'Ver treino';
          return;
        }

        workoutDetailsEl.innerHTML = GuideContent.renderWorkoutHtml(user.selectedWorkout);
        workoutDetailsEl.style.display = '';
        workoutViewBtn.textContent = 'Ocultar treino';
      });
    }

    const workoutChangeBtn = document.getElementById('planWorkoutChangeBtn');
    if (workoutChangeBtn && !workoutChangeBtn.dataset.bound) {
      workoutChangeBtn.dataset.bound = 'true';
      workoutChangeBtn.addEventListener('click', () => Onboarding.startAt('workout'));
    }

    const cardioChangeBtn = document.getElementById('planCardioChangeBtn');
    if (cardioChangeBtn && !cardioChangeBtn.dataset.bound) {
      cardioChangeBtn.dataset.bound = 'true';
      cardioChangeBtn.addEventListener('click', () => Onboarding.startAt('cardio'));
    }
  },

  /**
   * [REVISADO] Seção "📋 Hoje" — um único card de status, sem duplicar a aba
   * Check-in. Tanto o check-in quanto o cardio agora são só leitura aqui:
   * a aba Check-in é a fonte única da verdade pros dois (didCardio já é um
   * campo real do check-in, sincronizado no Supabase — não fica mais preso
   * a este dispositivo). O contador semanal de cardio é comparado com a meta
   * (user.cardioDays) definida no onboarding.
   */
  _renderTodayChecklist() {
    const todayKey = Utils.getDateKey(new Date());
    const entry = Storage.getCheckinByDateKey(todayKey);

    this._renderCheckinStatus(entry);
    this._renderCardioStatus(entry);
  },

  _renderCheckinStatus(entry) {
    const icon = document.getElementById('todayCheckinIcon');
    const hint = document.getElementById('todayCheckinHint');
    const btn = document.getElementById('todayCheckinBtn');
    const row = btn ? btn.closest('.today-status__row') : null;

    const done = !!entry;

    if (icon) icon.textContent = done ? '✅' : '⭕';
    if (row) row.classList.toggle('today-status__row--done', done);

    if (hint) {
      if (done) {
        const time = new Date(entry.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        hint.textContent = `Feito às ${time}`;
      } else {
        hint.textContent = 'Ainda não feito';
      }
    }

    if (btn) btn.textContent = done ? 'Atualizar' : 'Fazer';
  },

  _cardioWeekKeys(referenceDate = new Date()) {
    // Semana corrente (domingo a sábado) a partir da data de referência.
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    const keys = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      keys.push(Utils.getDateKey(d));
    }
    return keys;
  },

  _renderCardioStatus(todayEntry) {
    const icon = document.getElementById('todayCardioIcon');
    const hint = document.getElementById('todayCardioHint');
    if (!hint) return;

    const user = Storage.getUser();
    const goal = user && user.cardioDays ? user.cardioDays : null;

    const weekKeys = this._cardioWeekKeys();
    const checkins = Storage.getCheckins();
    const doneCount = checkins.filter((c) => weekKeys.includes(c.dateKey) && c.didCardio === true).length;

    if (icon) icon.textContent = todayEntry && todayEntry.didCardio === true ? '✅' : '⭕';
    hint.textContent = goal ? `${doneCount} de ${goal}x essa semana` : `${doneCount}x essa semana`;
  },

  /** Passo 1 — Calcular metas: muda de visual assim que já existem metas salvas */
  _renderGoalsStep() {
    const hasGoals = Storage.hasGoals();

    const card = document.getElementById('stepCardGoals');
    const titleEl = document.getElementById('stepTitleGoals');
    const btnEl = document.getElementById('stepBtnGoals');
    const checkEl = document.getElementById('stepCheckGoals');

    if (card) card.classList.toggle('is-complete', hasGoals);
    if (checkEl) checkEl.style.display = hasGoals ? 'flex' : 'none';
    if (titleEl) titleEl.textContent = hasGoals ? '✅ Metas calculadas' : 'Calcule suas metas';
    if (btnEl) btnEl.textContent = hasGoals ? 'Atualizar metas' : 'Calcular minhas metas';
  },

  /** Passo do check-in — muda de visual assim que o check-in de hoje já foi feito */
  _renderCheckinStep() {
    const todayKey = Utils.getDateKey(new Date());
    const todayEntry = Storage.getCheckinByDateKey(todayKey);
    const done = !!todayEntry;

    const card = document.getElementById('stepCardCheckin');
    const titleEl = document.getElementById('stepTitleCheckin');
    const btnEl = document.getElementById('stepBtnCheckin');
    const checkEl = document.getElementById('stepCheckToday');
    const metaEl = document.getElementById('stepCheckinMeta');

    if (card) card.classList.toggle('is-complete', done);
    if (checkEl) checkEl.style.display = done ? 'flex' : 'none';
    if (titleEl) titleEl.textContent = done ? '✅ Check-in de hoje realizado' : 'Faça seu check-in diário';
    if (btnEl) btnEl.textContent = done ? 'Atualizar check-in' : 'Fazer Check-in';

    if (metaEl) {
      if (done) {
        const time = new Date(todayEntry.savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        metaEl.textContent = `Último check-in: hoje às ${time}`;
        metaEl.style.display = 'block';
      } else {
        metaEl.style.display = 'none';
      }
    }
  },
};
