/**
 * dashboard.js
 * Renderiza o Início: saudação, card de status "Hoje" (check-in feito/
 * pendente + contador semanal de cardio) e a checagem de desafio concluído.
 * O anel/estatísticas/grade de 30 dias e o histórico completo, que antes
 * ficavam em abas próprias, agora são renderizados por progress.js dentro
 * desta mesma view (view-dashboard) — Progress.render()/History.render()
 * continuam sendo chamados junto de Dashboard.render() nos mesmos lugares
 * de sempre (boot, check-in salvo, sincronização). "Seu Plano" (dieta/
 * treino/cardio) virou a própria aba — ver plan.js.
 */

const CHALLENGE_LENGTH_DAYS = 30;

const Dashboard = {
  render() {
    const user = Storage.getUser();
    if (!user) return;

    const currentDay = Utils.getCurrentChallengeDay(user.startDate);
    const isComplete = currentDay > CHALLENGE_LENGTH_DAYS;

    this._renderGreeting(user.name);
    this._renderTodayStatus();

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

  /** Card "📋 Hoje" — status de leitura do check-in e do cardio da semana.
   *  A aba Check-in é a única fonte da verdade pros dois; aqui é só resumo. */
  _renderTodayStatus() {
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
};
