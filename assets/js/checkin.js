/**
 * checkin.js
 * Controla o formulário de check-in diário (seleções, validação e salvamento).
 */

const Checkin = {
  state: {
    trained: null,
    sleptWell: null,
    energy: null,
    nutrition: null,
  },

  init() {
    this._bindOptionGroups();
    this._prefillToday();
  },

  _bindOptionGroups() {
    document.querySelectorAll('#viewCheckin [data-toggle-group="trained"] .toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => this._selectToggle('trained', btn, 'trainedRow'));
    });

    document.querySelectorAll('#viewCheckin [data-toggle-group="sleptWell"] .toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => this._selectToggle('sleptWell', btn, 'sleptWellRow'));
    });

    document.querySelectorAll('#energyScale .scale-dot').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.energy = Number(btn.dataset.value);
        document.querySelectorAll('#energyScale .scale-dot').forEach((d) => d.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
    });

    document.querySelectorAll('#nutritionOptions .option-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.nutrition = btn.dataset.value;
        document.querySelectorAll('#nutritionOptions .option-chip').forEach((c) => c.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
    });
  },

  _selectToggle(key, btn, rowId) {
    this.state[key] = btn.dataset.value === 'sim';
    const row = document.getElementById(rowId);
    row.querySelectorAll('.toggle-btn').forEach((b) => {
      b.classList.remove('is-selected--yes', 'is-selected--no');
    });
    btn.classList.add(btn.dataset.value === 'sim' ? 'is-selected--yes' : 'is-selected--no');
  },

  _prefillToday() {
    const todayKey = Utils.getDateKey(new Date());
    const existing = Storage.getCheckinByDateKey(todayKey);
    if (!existing) return;

    document.getElementById('checkinWeight').value = existing.weight ?? '';
    document.getElementById('checkinWater').value = existing.waterMl ?? '';
    document.getElementById('checkinNotes').value = existing.notes ?? '';

    if (existing.trained !== null) {
      const btn = document.querySelector(`#trainedRow .toggle-btn[data-value="${existing.trained ? 'sim' : 'nao'}"]`);
      if (btn) this._selectToggle('trained', btn, 'trainedRow');
    }
    if (existing.sleptWell !== null) {
      const btn = document.querySelector(`#sleptWellRow .toggle-btn[data-value="${existing.sleptWell ? 'sim' : 'nao'}"]`);
      if (btn) this._selectToggle('sleptWell', btn, 'sleptWellRow');
    }
    if (existing.energy) {
      const dot = document.querySelector(`#energyScale .scale-dot[data-value="${existing.energy}"]`);
      if (dot) { this.state.energy = existing.energy; dot.classList.add('is-selected'); }
    }
    if (existing.nutrition) {
      const chip = document.querySelector(`#nutritionOptions .option-chip[data-value="${existing.nutrition}"]`);
      if (chip) { this.state.nutrition = existing.nutrition; chip.classList.add('is-selected'); }
    }
  },

  save() {
    const weight = document.getElementById('checkinWeight').value;
    const waterMl = document.getElementById('checkinWater').value;
    const notes = document.getElementById('checkinNotes').value.trim();

    if (!weight) {
      Toast.show('Informe seu peso de hoje para salvar.', 'error');
      return;
    }

    const user = Storage.getUser();
    const now = new Date();
    const dateKey = Utils.getDateKey(now);
    const dayNumber = Utils.getCurrentChallengeDay(user.startDate, now);

    const entry = {
      dateKey,
      dayNumber,
      weight: Number(weight),
      waterMl: waterMl ? Number(waterMl) : null,
      trained: this.state.trained,
      sleptWell: this.state.sleptWell,
      energy: this.state.energy,
      nutrition: this.state.nutrition,
      notes,
      savedAt: now.toISOString(),
    };

    Storage.saveCheckin(entry);
    Toast.show('Check-in salvo com sucesso!', 'success');

    Dashboard.render();
    Progress.render();
    History.render();

    App.goToView('dashboard');
  },
};
