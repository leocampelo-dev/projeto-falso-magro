/**
 * substitutions.js
 * Modal "Substituições" — abre ao clicar num item de refeição que tenha
 * alternativas cadastradas em FOOD_SUBSTITUTIONS (diet-models.js).
 * Usa delegação de evento no document, então funciona em qualquer lugar
 * onde DietModels.renderHtml() for injetado (Meu Plano, onboarding etc.),
 * sem precisar religar listeners a cada render.
 *
 * [NOVO — item 9] Clicar numa substituição aplica ela de verdade no lugar
 * do alimento original (Storage.setFoodSwap), sincronizado com o Supabase
 * igual ao resto do perfil. Depois de escolher, dispara o evento
 * "foodswap:changed" no document — qualquer tela que esteja mostrando um
 * plano de dieta (Meu Plano, onboarding) escuta esse evento e se
 * re-renderiza sozinha, sem essas duas telas precisarem se conhecer.
 */

const Substitutions = {
  _currentFood: null,

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
      const choiceRow = e.target.closest('[data-swap-food]');
      if (choiceRow) {
        const isReset = choiceRow.dataset.swapFood === '__original__';
        this._applyChoice(isReset ? null : { food: choiceRow.dataset.swapFood, qty: choiceRow.dataset.swapQty });
        return;
      }

      const row = e.target.closest('[data-subs]');
      if (!row) return;
      this._openFromRow(row);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      const choiceRow = e.target.closest('[data-swap-food]');
      if (choiceRow) {
        e.preventDefault();
        const isReset = choiceRow.dataset.swapFood === '__original__';
        this._applyChoice(isReset ? null : { food: choiceRow.dataset.swapFood, qty: choiceRow.dataset.swapQty });
        return;
      }

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

    this._currentFood = food;
    const activeSwap = Storage.getFoodSwap(food);

    titleEl.textContent = food;

    if (subs && subs.length) {
      const optionsHtml = subs.map((s) => {
        const isActive = activeSwap && activeSwap.food === s.food;
        return `
          <div class="guide-table__row guide-table__row--clickable" role="button" tabindex="0" data-swap-food="${s.food.replace(/"/g, '&quot;')}" data-swap-qty="${s.qty.replace(/"/g, '&quot;')}">
            <span class="guide-table__food">${isActive ? '✅ ' : ''}${s.food}</span>
            <span class="guide-table__qty">${s.qty}</span>
          </div>
        `;
      }).join('');

      const resetHtml = activeSwap ? `
        <div class="guide-table__row guide-table__row--clickable" role="button" tabindex="0" data-swap-food="__original__">
          <span class="guide-table__food">↺ Usar o alimento original (${food})</span>
        </div>
      ` : '';

      listEl.innerHTML = `
        ${optionsHtml}${resetHtml}
        <p class="field__hint" style="margin-top:12px;">Quantidade de referência — pode variar um pouco conforme seu plano de calorias.</p>
      `;
    } else {
      listEl.innerHTML = `<p class="field__hint">Sem substituições específicas cadastradas pra este item.</p>`;
    }

    overlay.classList.add('is-visible');
  },

  async _applyChoice(chosenOrNull) {
    if (!this._currentFood) return;

    if (chosenOrNull) {
      await Storage.setFoodSwap(this._currentFood, chosenOrNull);
    } else {
      await Storage.clearFoodSwap(this._currentFood);
    }

    document.dispatchEvent(new CustomEvent('foodswap:changed'));
    this.close();
  },

  close() {
    const overlay = document.getElementById('substitutionOverlay');
    if (overlay) overlay.classList.remove('is-visible');
    this._currentFood = null;
  },
};
