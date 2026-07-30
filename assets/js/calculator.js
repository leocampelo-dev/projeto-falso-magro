/**
 * calculator.js
 * Cálculo de TMB, GET, calorias e macronutrientes.
 * Fórmula utilizada: Mifflin-St Jeor (referência confiável e amplamente validada).
 */

const ACTIVITY_FACTORS = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muito_alto: 1.9,
};

const GOAL_SETTINGS = {
  perder_gordura: { calorieAdjust: -0.20, proteinPerKg: 2.2 },
  recomposicao: { calorieAdjust: -0.08, proteinPerKg: 2.0 },
  ganhar_massa: { calorieAdjust: 0.12, proteinPerKg: 1.8 },
};

const Calculator = {
  /** Taxa Metabólica Basal — fórmula de Mifflin-St Jeor */
  calculateTMB({ sex, weight, height, age }) {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return sex === 'masculino' ? base + 5 : base - 161;
  },

  /** Gasto Energético Total = TMB x fator de atividade */
  calculateGET(tmb, activityLevel) {
    const factor = ACTIVITY_FACTORS[activityLevel] || 1.2;
    return tmb * factor;
  },

  /** Monta o objetivo diário completo a partir dos dados do formulário */
  calculateGoals(formData) {
    const { sex, age, weight, height, activityLevel, goal } = formData;

    const tmb = this.calculateTMB({ sex, weight: Number(weight), height: Number(height), age: Number(age) });
    const get = this.calculateGET(tmb, activityLevel);

    const settings = GOAL_SETTINGS[goal];
    const calories = get * (1 + settings.calorieAdjust);

    const proteinGrams = settings.proteinPerKg * Number(weight);
    const proteinCalories = proteinGrams * 4;

    const fatCalories = calories * 0.25;
    const fatGrams = fatCalories / 9;

    const carbsCalories = Math.max(calories - proteinCalories - fatCalories, 0);
    const carbsGrams = carbsCalories / 4;

    const waterMl = Number(weight) * 35;

    return {
      tmb: Math.round(tmb),
      get: Math.round(get),
      calories: Math.round(calories),
      protein: Math.round(proteinGrams),
      carbs: Math.round(carbsGrams),
      fat: Math.round(fatGrams),
      water: Math.round(waterMl),
      input: { sex, age: Number(age), weight: Number(weight), height: Number(height), activityLevel, goal },
      calculatedAt: new Date().toISOString(),
    };
  },
};
