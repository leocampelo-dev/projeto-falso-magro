/**
 * onboarding.js
 * Assistente "Vamos montar seu projeto" — 4 passos:
 *   1) Calculadora (reaproveita o modal existente)
 *   2) Escolher dieta (1600 / 1800 / 2000 / 2200 kcal)
 *   3) Escolher treino (3x / 4x / 5x)
 *   4) Configurar cardio (dias / minutos / tipo)
 *   5) Resumo + "Começar meu projeto"
 *
 * Não duplica a calculadora nem os cálculos existentes: usa Calculator/Storage
 * exatamente como o resto do app já usa.
 */

const Onboarding = {
  _active: false,
  _step: 1,
  _expandedDiet: null,
  _editingFromHome: false,
  _draft: {
    selectedDiet: null,
    selectedWorkout: null,
    cardioDays: null,
    cardioMinutes: null,
    cardioType: null,
    cardioCustomType: '',
  },

  init() {
    this._bindStepButtons();
  },

  isActive() {
    return this._active;
  },

  /** Abre o assistente. Pré-preenche com o que o usuário já tiver salvo. */
  start() {
    const user = Storage.getUser() || {};
    this._draft = {
      selectedDiet: user.selectedDiet || null,
      selectedWorkout: user.selectedWorkout || null,
      cardioDays: user.cardioDays || null,
      cardioMinutes: user.cardioMinutes || null,
      cardioType: user.cardioType || null,
      cardioCustomType: user.cardioCustomType || '',
    };

    this._active = true;
    this._expandedDiet = null;
    this._editingFromHome = false;
    // Se o usuário já tem metas calculadas (ex: usuário antigo), pula o Passo 1.
    this._step = Storage.hasGoals() ? 2 : 1;

    App._showScreen('screenOnboarding');
    this._renderStep();
  },

  /**
   * [NOVO — Fase 5] Abre o assistente já no passo certo, chamado pelos
   * botões "Alterar" da Home. Ao terminar, salva e volta pra Home — não
   * mexe em check-ins, progresso ou histórico.
   */
  startAt(section) {
    const user = Storage.getUser() || {};
    this._draft = {
      selectedDiet: user.selectedDiet || null,
      selectedWorkout: user.selectedWorkout || null,
      cardioDays: user.cardioDays || null,
      cardioMinutes: user.cardioMinutes || null,
      cardioType: user.cardioType || null,
      cardioCustomType: user.cardioCustomType || '',
    };

    this._active = true;
    this._expandedDiet = null;
    this._editingFromHome = true;

    const stepMap = { diet: 2, workout: 3, cardio: 4 };
    this._step = stepMap[section] || 2;

    App._showScreen('screenOnboarding');
    this._renderStep();
  },

  /** Chamado pelo app.js quando a calculadora (modal) é salva durante o onboarding.
   *  IMPORTANTE: não avança automaticamente — fica no Passo 1 mostrando o
   *  resultado (calorias/macros) e só avança quando a pessoa clicar em
   *  "Montar meu projeto". */
  onGoalsSaved() {
    if (!this._active) return;
    this._step = 1;
    this._renderStep();
  },

  _bindStepButtons() {
    document.getElementById('onbBackBtn').addEventListener('click', () => this._goBack());

    document.getElementById('onbOpenCalcBtn').addEventListener('click', () => App._openCalculatorModal());
    document.getElementById('onbStep1ContinueBtn').addEventListener('click', () => this._goToStep(2));

    document.getElementById('onbStep2ContinueBtn').addEventListener('click', () => {
      if (!this._draft.selectedDiet) {
        Toast.show('Escolha um modelo de alimentação para continuar.', 'error');
        return;
      }
      this._goToStep(3);
    });

    document.getElementById('onbStep3ContinueBtn').addEventListener('click', () => {
      if (!this._draft.selectedWorkout) {
        Toast.show('Escolha quantos dias você vai treinar.', 'error');
        return;
      }
      this._goToStep(4);
    });

    document.getElementById('onbStep4ContinueBtn').addEventListener('click', () => {
      if (!this._draft.cardioDays || !this._draft.cardioMinutes || !this._draft.cardioType) {
        Toast.show('Complete a configuração do cardio para continuar.', 'error');
        return;
      }
      this._goToStep(5);
    });

    document.getElementById('onbFinishBtn').addEventListener('click', () => this._finish());

    document.getElementById('onbCardioCustomType').addEventListener('input', (e) => {
      this._draft.cardioCustomType = e.target.value;
    });
  },

  _goToStep(step) {
    this._step = step;
    this._renderStep();
  },

  _goBack() {
    if (this._step > 1) {
      this._step -= 1;
      this._renderStep();
    }
  },

  _renderStep() {
    document.querySelectorAll('.onb-step').forEach((el) => el.classList.remove('is-active'));
    const target = document.getElementById(`onbStep${this._step}`);
    if (target) target.classList.add('is-active');

    const backBtn = document.getElementById('onbBackBtn');
    backBtn.style.visibility = this._step > 1 ? 'visible' : 'hidden';

    const label = document.getElementById('onbStepLabel');
    label.textContent = this._step <= 4 ? `PASSO ${this._step} DE 4` : 'TUDO PRONTO';

    if (this._step === 1) this._renderStep1();
    if (this._step === 2) this._renderStep2();
    if (this._step === 3) this._renderStep3();
    if (this._step === 4) this._renderStep4();
    if (this._step === 5) this._renderStep5();

    this._renderCalorieReminder();

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  },

  /** Lembrete fixo da meta calórica, visível a partir do Passo 2 (no Passo 1
   *  o resultado completo já aparece no card, então o lembrete fica escondido
   *  pra não repetir a mesma informação duas vezes). */
  _renderCalorieReminder() {
    const reminder = document.getElementById('onbCalorieReminder');
    if (!reminder) return;

    const goals = Storage.getGoals();
    if (this._step >= 2 && goals) {
      reminder.textContent = `🔥 Sua meta: ${goals.calories} kcal/dia`;
      reminder.style.display = '';
    } else {
      reminder.style.display = 'none';
    }
  },

  _renderStep1() {
    const goals = Storage.getGoals();
    const doneWrap = document.getElementById('onbStep1Done');
    const emptyWrap = document.getElementById('onbStep1Empty');

    if (goals) {
      emptyWrap.style.display = 'none';
      doneWrap.style.display = '';
      document.getElementById('onbCaloriesResult').textContent = `${goals.calories} kcal`;
      document.getElementById('onbProteinResult').textContent = `${goals.protein} g`;
      document.getElementById('onbCarbsResult').textContent = `${goals.carbs} g`;
      document.getElementById('onbFatResult').textContent = `${goals.fat} g`;
    } else {
      emptyWrap.style.display = '';
      doneWrap.style.display = 'none';
    }
  },

  /** Macros da meta calórica escolhida — delega pro Calculator (mesma lógica
   *  usada na Home), passando a proteína já calculada do usuário. */
  _dietMacros(kcal) {
    const goals = Storage.getGoals();
    const proteinG = goals ? goals.protein : Math.round((kcal * 0.3) / 4);
    const macros = Calculator.calculateMacrosForTarget(kcal, proteinG);
    return { proteinG: macros.protein, carbsG: macros.carbs, fatG: macros.fat };
  },

  _recommendedDiet() {
    const goals = Storage.getGoals();
    if (!goals) return DIET_OPTIONS[1];
    return DIET_OPTIONS.reduce(
      (best, kcal) => (Math.abs(kcal - goals.calories) < Math.abs(best - goals.calories) ? kcal : best),
      DIET_OPTIONS[0]
    );
  },

  _renderStep2() {
    const wrap = document.getElementById('onbDietOptions');
    const recommended = this._recommendedDiet();

    wrap.innerHTML = DIET_OPTIONS.map((kcal) => {
      const macros = this._dietMacros(kcal);
      const isSelected = this._draft.selectedDiet === String(kcal);
      const isRecommended = kcal === recommended;
      const isExpanded = this._expandedDiet === kcal;
      const model = DietModels.get(kcal);

      return `
        <div class="plan-option-wrap">
          <button type="button" class="plan-option ${isSelected ? 'is-selected' : ''}" data-diet="${kcal}">
            ${isRecommended ? '<span class="plan-option__badge">⭐ Recomendado para você</span>' : ''}
            <div class="plan-option__title">${isSelected ? '✓ ' : ''}${kcal} kcal</div>
            <div class="plan-option__macros">
              <span>Proteína: ${macros.proteinG}g</span>
              <span>Carboidratos: ${macros.carbsG}g</span>
              <span>Gorduras: ${macros.fatG}g</span>
            </div>
          </button>
          ${model ? `
            <button type="button" class="plan-option__toggle" data-diet-toggle="${kcal}">
              ${isExpanded ? '▲ Ocultar modelo' : '▼ Ver modelo'}
            </button>
            <div class="plan-option__details" style="display:${isExpanded ? '' : 'none'};">
              ${DietModels.renderHtml(model)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    wrap.querySelectorAll('[data-diet]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._draft.selectedDiet = btn.dataset.diet;
        this._renderStep2();
      });
    });

    wrap.querySelectorAll('[data-diet-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kcal = Number(btn.dataset.dietToggle);
        this._expandedDiet = this._expandedDiet === kcal ? null : kcal;
        this._renderStep2();
      });
    });
  },

  _renderStep3() {
    const wrap = document.getElementById('onbWorkoutOptions');

    wrap.innerHTML = WORKOUT_OPTIONS.map((opt) => {
      const isSelected = this._draft.selectedWorkout === opt.value;
      return `
        <button type="button" class="plan-option ${isSelected ? 'is-selected' : ''}" data-workout="${opt.value}">
          <div class="plan-option__title">${isSelected ? '✓ ' : ''}${opt.label}</div>
          <div class="plan-option__macros"><span>${opt.desc}</span></div>
        </button>
      `;
    }).join('');

    wrap.querySelectorAll('[data-workout]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._draft.selectedWorkout = btn.dataset.workout;
        this._renderStep3();
      });
    });
  },

  _renderStep4() {
    const daysWrap = document.getElementById('onbCardioDays');
    daysWrap.innerHTML = CARDIO_DAY_OPTIONS.map(
      (d) => `<button type="button" class="option-chip ${this._draft.cardioDays === d ? 'is-selected' : ''}" data-cardio-day="${d}">${d}x</button>`
    ).join('');
    daysWrap.querySelectorAll('[data-cardio-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._draft.cardioDays = Number(btn.dataset.cardioDay);
        this._renderStep4();
      });
    });

    const minWrap = document.getElementById('onbCardioMinutes');
    minWrap.innerHTML = CARDIO_MINUTE_OPTIONS.map(
      (m) => `<button type="button" class="option-chip ${this._draft.cardioMinutes === m ? 'is-selected' : ''}" data-cardio-min="${m}">${m} min</button>`
    ).join('');
    minWrap.querySelectorAll('[data-cardio-min]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._draft.cardioMinutes = Number(btn.dataset.cardioMin);
        this._renderStep4();
      });
    });

    const typeWrap = document.getElementById('onbCardioType');
    typeWrap.innerHTML = CARDIO_TYPE_OPTIONS.map(
      (t) => `<button type="button" class="option-chip ${this._draft.cardioType === t.value ? 'is-selected' : ''}" data-cardio-type="${t.value}">${t.label}</button>`
    ).join('');
    typeWrap.querySelectorAll('[data-cardio-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._draft.cardioType = btn.dataset.cardioType;
        this._renderStep4();
      });
    });

    const customWrap = document.getElementById('onbCardioCustomWrap');
    customWrap.style.display = this._draft.cardioType === 'outro' ? '' : 'none';
    document.getElementById('onbCardioCustomType').value = this._draft.cardioCustomType || '';

    const volumeEl = document.getElementById('onbCardioVolume');
    if (this._draft.cardioDays && this._draft.cardioMinutes) {
      volumeEl.style.display = '';
      volumeEl.textContent = `Volume semanal: ${this._draft.cardioDays} × ${this._draft.cardioMinutes} = ${this._draft.cardioDays * this._draft.cardioMinutes} min/semana`;
    } else {
      volumeEl.style.display = 'none';
    }
  },

  _renderStep5() {
    document.getElementById('onbSummaryDiet').textContent = this._draft.selectedDiet ? `${this._draft.selectedDiet} kcal` : '—';

    const workoutOpt = WORKOUT_OPTIONS.find((w) => w.value === this._draft.selectedWorkout);
    document.getElementById('onbSummaryWorkout').textContent = workoutOpt ? `${workoutOpt.desc} — ${workoutOpt.label}` : '—';

    const typeOpt = CARDIO_TYPE_OPTIONS.find((t) => t.value === this._draft.cardioType);
    const cardioTypeLabel = this._draft.cardioType === 'outro' ? (this._draft.cardioCustomType || 'Outro') : (typeOpt || {}).label;
    document.getElementById('onbSummaryCardio').textContent =
      `${this._draft.cardioDays}x/semana · ${this._draft.cardioMinutes} min · ${cardioTypeLabel || '—'}`;

    const finishBtn = document.getElementById('onbFinishBtn');
    if (finishBtn) finishBtn.textContent = this._editingFromHome ? '💾 Salvar alterações' : '🚀 Começar meu projeto';
  },

  async _finish() {
    const btn = document.getElementById('onbFinishBtn');
    btn.disabled = true;

    // [NOVO] mini-loading divertido ao "montar" o projeto
    await MiniLoader.show(
      [
        'Disponibilizando seu treino para ficar com o físico atlético 💪',
        'Configurando seu cardio ❤️',
        'Preparando seu projeto de 30 dias 🚀',
      ],
      1800
    );

    const result = await Storage.saveProjectConfig({
      selectedDiet: this._draft.selectedDiet,
      selectedWorkout: this._draft.selectedWorkout,
      cardioDays: this._draft.cardioDays,
      cardioMinutes: this._draft.cardioMinutes,
      cardioType: this._draft.cardioType,
      cardioCustomType: this._draft.cardioCustomType,
      projectConfigured: true,
    });

    MiniLoader.hide();
    btn.disabled = false;
    this._active = false;
    this._editingFromHome = false;

    if (result.ok) {
      Toast.show('Seu projeto foi configurado com sucesso!', 'success');
    } else {
      Toast.show('Projeto salvo neste dispositivo — sincronização pendente.', 'error');
    }

    App.completeOnboarding();
  },
};
