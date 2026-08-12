/**
 * plan.js
 * Renderiza a aba "🎯 Meu Plano": dieta, treino e cardio escolhidos no
 * onboarding, com "Ver alimentação"/"Ver treino" (accordion inline) e
 * "Alterar" (reabre o assistente no passo certo). Extraído do dashboard.js
 * quando "Meu Plano" virou aba própria, pra não misturar as duas
 * responsabilidades no mesmo arquivo.
 */

const Plan = {
  render() {
    const user = Storage.getUser();
    if (!user) return;

    this._renderPlanCard(user);
    this._bindPlanActions();
  },

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

  /** Usa dataset.bound pra não duplicar o listener a cada render(). */
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

    // "Ver treino" — mesmo padrão do "Ver alimentação", reaproveitando
    // GUIDE_WORKOUTS (guide-content.js) via GuideContent.renderWorkoutHtml().
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
};
