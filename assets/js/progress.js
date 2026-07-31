/**
 * progress.js
 * Renderiza a aba Progresso: anel do dia atual, metas calculadas (calorias/macros),
 * estatísticas (sequência, total, percentual) e a grade de 30 dias.
 * Também renderiza a aba Histórico (lista de check-ins anteriores).
 */

const Progress = {
  render() {
    const user = Storage.getUser();
    if (!user) return;

    const rawDay = Utils.getCurrentChallengeDay(user.startDate);
    const isComplete = rawDay > CHALLENGE_LENGTH_DAYS;
    const currentDay = Math.min(rawDay, CHALLENGE_LENGTH_DAYS);

    const checkins = Storage.getCheckins();
    const doneDays = new Set(checkins.map((c) => c.dayNumber));
    const completedCount = doneDays.size;
    const ratio = Math.min(completedCount / CHALLENGE_LENGTH_DAYS, 1);

    this._renderRing(currentDay, isComplete);
    this._renderQuickStats(user);
    this._renderGoals();

    const fillEl = document.getElementById('progressFill');
    if (fillEl) fillEl.style.width = `${ratio * 100}%`;

    const metaEl = document.getElementById('progressMeta');
    if (metaEl) metaEl.textContent = `${completedCount} de ${CHALLENGE_LENGTH_DAYS} dias`;

    this._renderGrid(doneDays, currentDay);
    this._renderStats(doneDays, currentDay, completedCount);
  },

  /* ---------- Anel "Dia X de 30" ---------- */
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

  /* ---------- Metas diárias (calorias e macros) ---------- */
  _renderGoals() {
    const goals = Storage.getGoals();
    const emptyState = document.getElementById('dashGoalsEmpty');
    const grid = document.getElementById('dashGoalsGrid');
    const recalcWrap = document.getElementById('dashRecalcWrap');

    if (!goals) {
      if (emptyState) emptyState.style.display = 'block';
      if (grid) grid.style.display = 'none';
      if (recalcWrap) recalcWrap.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (grid) grid.style.display = 'grid';
    if (recalcWrap) recalcWrap.style.display = 'block';

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

  /* ---------- Estatísticas (sequência, total, percentual) ---------- */
  _renderStats(doneDays, currentDay, completedCount) {
    const streak = this._calculateStreak(doneDays, currentDay);
    const percent = Math.round((completedCount / CHALLENGE_LENGTH_DAYS) * 100);

    const streakEl = document.getElementById('progressStreak');
    const totalEl = document.getElementById('progressTotal');
    const percentEl = document.getElementById('progressPercent');

    if (streakEl) streakEl.textContent = streak;
    if (totalEl) totalEl.textContent = completedCount;
    if (percentEl) percentEl.textContent = `${percent}%`;
  },

  /** Sequência atual de dias consecutivos com check-in, terminando em hoje ou ontem */
  _calculateStreak(doneDays, currentDay) {
    let day = doneDays.has(currentDay) ? currentDay : currentDay - 1;
    let streak = 0;

    while (day >= 1 && doneDays.has(day)) {
      streak++;
      day--;
    }
    return streak;
  },

  /* ---------- Grade de 30 dias ---------- */
  _renderGrid(doneDays, currentDay) {
    const grid = document.getElementById('progressGrid');
    if (!grid) return;

    grid.innerHTML = '';
    for (let day = 1; day <= CHALLENGE_LENGTH_DAYS; day++) {
      const dot = document.createElement('div');
      dot.className = 'day-dot';
      dot.textContent = doneDays.has(day) ? '✓' : String(day);

      if (doneDays.has(day)) {
        dot.classList.add('is-done');
      } else if (day < currentDay) {
        dot.classList.add('is-missed');
      }
      if (day === currentDay) dot.classList.add('is-today');

      grid.appendChild(dot);
    }
  },
};

const NUTRITION_LABELS = {
  excelente: 'Excelente',
  boa: 'Boa',
  regular: 'Regular',
  ruim: 'Ruim',
};

const History = {
  render() {
    const checkins = [...Storage.getCheckins()].reverse();

    const list = document.getElementById('historyList');
    const listCard = document.getElementById('historyListCard');
    const listTitle = document.getElementById('historyListTitle');
    const empty = document.getElementById('historyEmpty');
    const lastCard = document.getElementById('historyLastWeight');

    if (!list) return;

    if (!checkins.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      if (lastCard) lastCard.style.display = 'none';
      if (listCard) listCard.style.display = 'none';
      if (listTitle) listTitle.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (listCard) listCard.style.display = 'block';
    if (listTitle) listTitle.style.display = 'block';

    this._renderLastCheckin(checkins[0], lastCard);

    list.innerHTML = checkins.map((c) => this._renderItem(c)).join('');
  },

  _renderLastCheckin(last, lastCard) {
    if (!lastCard) return;
    lastCard.style.display = 'block';

    document.getElementById('historyLastWeightValue').textContent = `${last.weight} kg`;
    document.getElementById('historyLastWeightDate').textContent = `Dia ${last.dayNumber} · ${Utils.formatDateLabel(last.dateKey)}`;

    const tags = [];
    if (last.trained !== null) tags.push(last.trained ? '💪 Treinou' : '😴 Descanso');
    if (last.sleptWell !== null) tags.push(last.sleptWell ? '✔️ Dormiu bem' : '⚠️ Dormiu mal');
    if (last.energy) tags.push(`⚡ Energia ${last.energy}/10`);
    if (last.nutrition) tags.push(`🍽️ ${NUTRITION_LABELS[last.nutrition] || last.nutrition}`);

    const tagsEl = document.getElementById('historyLastCheckinTags');
    if (tagsEl) {
      tagsEl.innerHTML = tags.map((t) => `<span class="history-item__tag">${t}</span>`).join('');
    }
  },

  _renderItem(c) {
    const parts = [];
    if (c.trained !== null) parts.push(c.trained ? 'Treinou' : 'Não treinou');
    if (c.energy) parts.push(`Energia ${c.energy}/10`);

    return `
      <div class="history-item">
        <div class="history-item__day">DIA<br>${c.dayNumber}</div>
        <div class="history-item__body">
          <div class="history-item__title">${c.weight} kg · ${Utils.formatDateLabel(c.dateKey)}</div>
          <div class="history-item__meta">${parts.join(' · ') || 'Sem detalhes registrados'}</div>
        </div>
        ${c.nutrition ? `<span class="history-item__tag">${NUTRITION_LABELS[c.nutrition] || c.nutrition}</span>` : ''}
      </div>
    `;
  },
};
