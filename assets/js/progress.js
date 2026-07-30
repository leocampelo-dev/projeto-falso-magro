/**
 * progress.js
 * Renderiza a tela de progresso (barra + grade de 30 dias)
 * e a tela de histórico (lista de check-ins anteriores).
 */

const Progress = {
  render() {
    const user = Storage.getUser();
    if (!user) return;

    const checkins = Storage.getCheckins();
    const doneDays = new Set(checkins.map((c) => c.dayNumber));
    const currentDay = Math.min(Utils.getCurrentChallengeDay(user.startDate), CHALLENGE_LENGTH_DAYS);

    const completedCount = doneDays.size;
    const ratio = Math.min(completedCount / CHALLENGE_LENGTH_DAYS, 1);

    const fillEl = document.getElementById('progressFill');
    if (fillEl) fillEl.style.width = `${ratio * 100}%`;

    const metaEl = document.getElementById('progressMeta');
    if (metaEl) metaEl.textContent = `${completedCount} de ${CHALLENGE_LENGTH_DAYS} dias`;

    this._renderGrid(doneDays, currentDay);
  },

  _renderGrid(doneDays, currentDay) {
    const grid = document.getElementById('progressGrid');
    if (!grid) return;

    grid.innerHTML = '';
    for (let day = 1; day <= CHALLENGE_LENGTH_DAYS; day++) {
      const dot = document.createElement('div');
      dot.className = 'day-dot';
      dot.textContent = day;
      if (doneDays.has(day)) dot.classList.add('is-done');
      if (day === currentDay) dot.classList.add('is-today');
      grid.appendChild(dot);
    }
  },
};

const History = {
  render() {
    const checkins = [...Storage.getCheckins()].reverse();
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    const lastWeightCard = document.getElementById('historyLastWeight');

    if (!list) return;

    if (!checkins.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      if (lastWeightCard) lastWeightCard.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';

    if (lastWeightCard) {
      lastWeightCard.style.display = 'flex';
      const last = checkins[0];
      document.getElementById('historyLastWeightValue').textContent = `${last.weight} kg`;
      document.getElementById('historyLastWeightDate').textContent = Utils.formatDateLabel(last.dateKey);
    }

    list.innerHTML = checkins.map((c) => this._renderItem(c)).join('');
  },

  _renderItem(c) {
    const nutritionLabels = {
      excelente: 'Excelente',
      boa: 'Boa',
      regular: 'Regular',
      ruim: 'Ruim',
    };

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
        ${c.nutrition ? `<span class="history-item__tag">${nutritionLabels[c.nutrition] || c.nutrition}</span>` : ''}
      </div>
    `;
  },
};
