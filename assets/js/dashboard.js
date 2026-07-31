/**
 * dashboard.js
 * Renderiza a Home: apenas saudação e o checklist dinâmico de passos.
 * Metas, anel de progresso e estatísticas ficam na aba Progresso (progress.js).
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
