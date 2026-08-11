/**
 * project-options.js
 * Constantes compartilhadas de dieta/treino/cardio — usadas pelo onboarding
 * (Fase 2) e pela Home personalizada (Fase 5). Ficam num arquivo só pra não
 * duplicar a mesma lista em dois lugares.
 */

const DIET_OPTIONS = [1600, 1800, 2000, 2200];

const WORKOUT_OPTIONS = [
  { value: '3x', label: '3x por semana', desc: 'Full Body' },
  { value: '4x', label: '4x por semana', desc: 'Upper / Lower' },
  { value: '5x', label: '5x por semana', desc: 'Hipertrofia' },
];

const CARDIO_DAY_OPTIONS = [3, 4, 5, 6, 7];
const CARDIO_MINUTE_OPTIONS = [15, 20, 25, 30, 40];
const CARDIO_TYPE_OPTIONS = [
  { value: 'caminhada', label: 'Caminhada' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'escada', label: 'Escada' },
  { value: 'corrida', label: 'Corrida' },
  { value: 'outro', label: 'Outro' },
];
