/**
 * substitutions.js
 * Modal "Substituições" — abre ao clicar num item de refeição que tenha
 * alternativas cadastradas em FOOD_SUBSTITUTIONS (diet-models.js).
 * Usa delegação de evento no document, então funciona em qualquer lugar
 * onde DietModels.renderHtml() for injetado (Meu Plano, onboarding etc.),
 * sem precisar religar listeners a cada render.
 */

const Substitutions = {
  init() {
    this._bindClose();
    this._bindItemClicks();
  },

  _bindClose() {
    const overlay = document.getElementById('substitutionOverlay');
    const closeBtn = document.getElementById('substitutionCloseBtn');
    if (!overlay || !closeBtn) return;

    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  },

  _bindItemClicks() {
    document.addEventListener('click', (e) => {
      const row = e.target.closest('[data-subs]');
      if (!row) return;
      this._openFromRow(row);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const row = e.target.closest('[data-subs]');
      if (!row) return;
      e.preventDefault();
      this._openFromRow(row);
    });
  },

  _openFromRow(row) {
    const food = row.dataset.food || '';
    let subs = [];
    try {
      subs = JSON.parse(row.dataset.subs);
    } catch (err) {
      subs = [];
    }
    this.open(food, subs);
  },

  open(food, subs) {
    const overlay = document.getElementById('substitutionOverlay');
    const titleEl = document.getElementById('substitutionTitle');
    const listEl = document.getElementById('substitutionList');
    if (!overlay || !titleEl || !listEl) return;

    titleEl.textContent = food;

    if (subs && subs.length) {
      listEl.innerHTML = subs.map((s) => `
        <div class="guide-table__row">
          <span class="guide-table__food">${s}</span>
        </div>
      `).join('');
    } else {
      listEl.innerHTML = `<p class="field__hint">Sem substituições específicas cadastradas pra este item.</p>`;
    }

    overlay.classList.add('is-visible');
  },

  close() {
    const overlay = document.getElementById('substitutionOverlay');
    if (overlay) overlay.classList.remove('is-visible');
  },
};
