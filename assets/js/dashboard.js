/**
 * dashboard.js
 * Renderiza a tela inicial: saudação, dia do desafio, anel de progresso e metas.
 */

const CHALLENGE_LENGTH_DAYS = 30;

const Dashboard = {
  render() {
    const user = Storage.getUser();
    if (!user) return;

    const currentDay = Utils.getCurrentChallengeDay(user.startDate);
    const isComplete = currentDay > CHALLENGE_LENGTH_DAYS;
    const displayDay = Math.min(currentDay, CHALLENGE_LENGTH_DAYS);

    this._renderGreeting(user.name);
    this._renderRing(displayDay, isComplete);
    this._renderGoals();
    this._renderQuickStats(user);
    this._renderStepChecks();

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

  _renderRing(day, isComplete) {
    const dayLabel = document.getElementById('dashDayLabel');
    const ringProgress = document.getElementById('dashRingProgress');
    const ringNum = document.getElementById('dashRingNum');

    if (dayLabel) {
      dayLabel.textContent = isComplete
        ? 'Desafio concluído 🎉'
        : `Dia ${day} de ${CHALLENGE_LENGTH_DAYS}`;
    }

    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const progressRatio = Math.min(day / CHALLENGE_LENGTH_DAYS, 1);
    const offset = circumference - progressRatio * circumference;

    if (ringProgress) {
      ringProgress.style.strokeDasharray = `${circumference}`;
      ringProgress.style.strokeDashoffset = `${offset}`;
    }
    if (ringNum) ringNum.textContent = day;
  },

  _renderQuickStats(user) {
    const startEl = document.getElementById('dashStartDate');
    if (startEl) startEl.textContent = Utils.formatDateLabel(user.startDate);

    const lastWeightEl = document.getElementById('dashLastWeightInline');
    if (lastWeightEl) {
      const last = Storage.getLastCheckin();
      lastWeightEl.textContent = last ? `${last.weight} kg` : '—';
    }
  },

  _renderStepChecks() {
    const goalsCheck = document.getElementById('stepCheckGoals');
    if (goalsCheck) goalsCheck.style.display = Storage.hasGoals() ? 'flex' : 'none';

    const todayCheck = document.getElementById('stepCheckToday');
    if (todayCheck) {
      const todayKey = Utils.getDateKey(new Date());
      const hasToday = !!Storage.getCheckinByDateKey(todayKey);
      todayCheck.style.display = hasToday ? 'flex' : 'none';
    }
  },

  _renderGoals() {
    const goals = Storage.getGoals();
    const emptyState = document.getElementById('dashGoalsEmpty');
    const grid = document.getElementById('dashGoalsGrid');

    if (!goals) {
      if (emptyState) emptyState.style.display = 'block';
      if (grid) grid.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (grid) grid.style.display = 'grid';

    const map = {
      dashCalories: { value: goals.calories, unit: 'kcal' },
      dashProtein: { value: goals.protein, unit: 'g' },
      dashCarbs: { value: goals.carbs, unit: 'g' },
      dashFat: { value: goals.fat, unit: 'g' },
      dashWater: { value: (goals.water / 1000).toFixed(1), unit: 'L' },
    };

    Object.entries(map).forEach(([id, { value, unit }]) => {
      const valueEl = document.getElementById(`${id}Value`);
      if (valueEl) valueEl.innerHTML = `${value}<span class="goal-card__unit"> ${unit}</span>`;
    });
  },
};
