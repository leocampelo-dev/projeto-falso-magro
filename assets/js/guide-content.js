/**
 * guide-content.js
 * Exemplos de dieta e planos de treino, direto no app — mesmo conteúdo
 * do guia.pdf (páginas 18-19 e 24-29), pra consulta rápida sem precisar
 * abrir o PDF toda vez.
 */

const GUIDE_DIETS = {
  '1': {
    label: 'Dia simples',
    note: 'Exemplo baseado num perfil ilustrativo (homem, 80kg, atividade moderada, ~1.820 kcal e 176g de proteína). Suas metas reais estão na calculadora do app — use os valores de lá, não os desta página.',
    meals: [
      {
        name: 'Café da manhã',
        items: [
          ['Ovos', '150g', '3 unidades'],
          ['Pão integral', '30g', '1 fatia'],
          ['Pasta de amendoim', '15g', '1 col. de sopa'],
          ['Banana', '100g', '1 unidade média'],
        ],
      },
      {
        name: 'Almoço',
        items: [
          ['Frango grelhado', '180g', '1 filé grande'],
          ['Arroz', '150g cozido', '4 col. de sopa'],
          ['Feijão', '100g cozido', '1 concha'],
          ['Azeite', '5ml', '1 col. de chá'],
          ['Salada', 'à vontade', '—'],
        ],
      },
      {
        name: 'Lanche',
        items: [
          ['Iogurte natural integral', '170g', '1 pote'],
          ['Aveia', '30g', '3 col. de sopa'],
          ['Banana', '100g', '1 unidade'],
        ],
      },
      {
        name: 'Jantar',
        items: [
          ['Carne magra (patinho/coxão)', '150g', '1 bife médio'],
          ['Batata doce', '200g', '1 unidade grande'],
          ['Azeite', '5ml', '1 col. de chá'],
          ['Legumes no vapor', 'à vontade', '—'],
        ],
      },
    ],
  },
  '2': {
    label: 'Rotina corrida',
    note: 'Pra quem tem pouco tempo pra cozinhar. Dica: tenha opções rápidas disponíveis em casa — quanto menos decisões você precisar tomar com fome, mais fácil manter a rotina.',
    meals: [
      {
        name: 'Café da manhã',
        items: [
          ['Iogurte natural integral', '170g', '1 pote'],
          ['Aveia', '40g', '4 col. de sopa'],
          ['Banana', '100g', '1 unidade'],
          ['Mel ou pasta de amendoim', '10g', '1 col. de sobremesa'],
        ],
      },
      {
        name: 'Almoço',
        items: [
          ['Carne moída magra', '150g', '—'],
          ['Arroz', '150g cozido', '4 col. de sopa'],
          ['Feijão', '100g cozido', '1 concha'],
          ['Legumes', 'à vontade', '—'],
        ],
      },
      {
        name: 'Lanche',
        items: [
          ['Pão integral + ovo', '2 fatias + 2 ovos', '1 sanduíche'],
          ['Fruta', '100g', '1 unidade'],
        ],
      },
      {
        name: 'Jantar',
        items: [
          ['Frango desfiado ou filé', '180g', '—'],
          ['Batata / mandioca / arroz', '150g', '—'],
          ['Salada com azeite', 'à vontade + 5ml', '—'],
        ],
      },
    ],
  },
};

const GUIDE_WORKOUTS = {
  '3x': {
    label: 'Treino 3x por semana (ABC)',
    level: 'Iniciante / Intermediário',
    note: 'Frequência: A-B-C uma vez por semana, com 1 dia de descanso entre sessões quando possível.',
    days: [
      { day: 'A', focus: 'Peito / Ombro / Tríceps', exercises: 'Supino reto, Desenvolvimento com halteres, Elevação lateral, Tríceps corda', sets: '3×8-12 (isolado 3×10-15)', rest: '60-90s' },
      { day: 'B', focus: 'Costas / Bíceps', exercises: 'Puxada frente, Remada baixa, Remada unilateral, Rosca direta', sets: '3×8-12', rest: '60-90s' },
      { day: 'C', focus: 'Pernas / Abdômen', exercises: 'Agachamento, Leg press, Cadeira extensora, Mesa flexora, Panturrilha, Abdômen', sets: '3×10-12 (panturrilha 3×15)', rest: '60-90s' },
    ],
  },
  '4x': {
    label: 'Treino 4x por semana (ABCD)',
    level: 'Intermediário',
    note: 'Frequência: A-B-C-D, descanso, descanso, ou distribuído conforme sua rotina.',
    days: [
      { day: 'A', focus: 'Peito / Tríceps', exercises: 'Supino reto, Supino inclinado, Crucifixo/Peck deck, Tríceps testa', sets: '3×8-12', rest: '60-90s' },
      { day: 'B', focus: 'Costas / Bíceps', exercises: 'Puxada frente, Remada curvada, Remada cabo, Rosca alternada', sets: '3×8-12', rest: '60-90s' },
      { day: 'C', focus: 'Pernas', exercises: 'Agachamento, Leg press, Cadeira extensora, Mesa flexora, Panturrilha', sets: '3-4×8-12', rest: '90s' },
      { day: 'D', focus: 'Ombro / Abdômen', exercises: 'Desenvolvimento, Elevação lateral, Elevação posterior, Abdômen (3 variações)', sets: '3×10-15', rest: '60s' },
    ],
  },
  '5x': {
    label: 'Treino 5x por semana (ABCDE)',
    level: 'Intermediário / Avançado',
    note: null,
    days: [
      { day: 'A', focus: 'Peito', exercises: 'Supino reto, Supino inclinado, Crucifixo/Peck deck, Crossover', sets: '3-4×8-12', rest: '60-90s' },
      { day: 'B', focus: 'Costas', exercises: 'Puxada frente, Remada curvada, Remada cabo, Pull-over', sets: '3-4×8-12', rest: '60-90s' },
      { day: 'C', focus: 'Pernas', exercises: 'Agachamento, Leg press, Cadeira extensora, Mesa flexora, Panturrilha', sets: '4×8-12', rest: '90s' },
      { day: 'D', focus: 'Ombro', exercises: 'Desenvolvimento, Elevação lateral, Elevação posterior, Encolhimento', sets: '3×10-15', rest: '60s' },
      { day: 'E', focus: 'Braços / Abdômen', exercises: 'Rosca direta, Rosca martelo, Tríceps corda, Tríceps testa, Abdômen (3 variações)', sets: '3×10-15', rest: '45-60s' },
    ],
  },
  '6x': {
    label: 'Treino 6x por semana (ABC 2x)',
    level: 'Avançado',
    note: 'Mesma divisão do treino 3x, mas o ciclo roda duas vezes na semana: A-B-C-A-B-C, com 1 dia de descanso. Mesmos exercícios e faixas de repetição do plano 3x — a diferença é a frequência de estímulo por grupo muscular (2x por semana em vez de 1x). Indicado só pra quem já tem base de treino e recuperação (sono, alimentação) em dia.',
    days: [],
  },
  casa: {
    label: 'Treino em casa (3x por semana, corpo inteiro)',
    level: 'Completo, sem academia',
    note: 'Se tiver halteres ou elástico, aumente a carga progressivamente. Sem equipamento, aumente repetições ou reduza o descanso pra progredir.',
    days: [
      { day: '—', focus: 'Corpo inteiro', exercises: 'Agachamento livre (ou com mochila/galão de água)', sets: '4×12-15', rest: '60s' },
      { day: '—', focus: 'Corpo inteiro', exercises: 'Flexão de braço (ajustável: joelho, inclinada, padrão)', sets: '4× até quase a falha', rest: '60s' },
      { day: '—', focus: 'Corpo inteiro', exercises: 'Afundo alternado', sets: '3×12 por perna', rest: '60s' },
      { day: '—', focus: 'Corpo inteiro', exercises: 'Remada com elástico ou toalha na porta', sets: '3×12-15', rest: '60s' },
      { day: '—', focus: 'Corpo inteiro', exercises: 'Elevação de quadril', sets: '3×15', rest: '45s' },
      { day: '—', focus: 'Corpo inteiro', exercises: 'Prancha abdominal', sets: '3×30-45s', rest: '45s' },
      { day: '—', focus: 'Corpo inteiro', exercises: 'Panturrilha em pé', sets: '3×15-20', rest: '30s' },
    ],
  },
  cardio: {
    label: 'Cardio',
    level: 'Complemento, não substituto',
    note: 'Cardio não substitui treino de força. É um complemento pra gerar mais gasto calórico sem depender só da restrição alimentar. Intervalado é opcional, até 1x por semana.',
    stats: [
      ['Frequência', '2 a 4x por semana'],
      ['Duração', '20 a 40 minutos'],
      ['Intensidade', 'Moderada: dá pra conversar em frases curtas, mas não cantar'],
      ['Onde', 'Caminhada, esteira, bike, elíptico'],
    ],
    days: [],
  },
};

const GuideContent = {
  init() {
    this._bindToggle('guideContentToggle', (value) => {
      document.getElementById('guideDietPanel').style.display = value === 'dieta' ? '' : 'none';
      document.getElementById('guideTreinoPanel').style.display = value === 'treino' ? '' : 'none';
    });

    this._bindToggle('guideDietToggle', (value) => this._renderDiet(value));
    this._bindToggle('guideTreinoToggle', (value) => this._renderWorkout(value));
  },

  render() {
    this._renderDiet(this._activeValue('guideDietToggle') || '1');
    this._renderWorkout(this._activeValue('guideTreinoToggle') || '3x');
  },

  _bindToggle(groupId, onChange) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.option-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.option-chip').forEach((c) => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
        onChange(chip.dataset.value);
      });
    });
  },

  _activeValue(groupId) {
    const active = document.querySelector(`#${groupId} .option-chip.is-selected`);
    return active ? active.dataset.value : null;
  },

  _renderDiet(key) {
    const diet = GUIDE_DIETS[key];
    const el = document.getElementById('guideDietContent');
    if (!diet || !el) return;

    let html = `<p class="field__hint" style="margin-bottom:16px;">${diet.note}</p>`;

    diet.meals.forEach((meal) => {
      html += `<div class="card" style="margin-bottom:12px;">
        <div style="font-weight:700; font-family:var(--font-display); margin-bottom:10px;">${meal.name}</div>
        <div class="guide-table">`;
      meal.items.forEach(([food, qty, measure]) => {
        html += `<div class="guide-table__row">
          <span class="guide-table__food">${food}</span>
          <span class="guide-table__qty">${qty}</span>
          <span class="guide-table__measure">${measure}</span>
        </div>`;
      });
      html += `</div></div>`;
    });

    el.innerHTML = html;
  },

  _renderWorkout(key) {
    const el = document.getElementById('guideTreinoContent');
    if (!el) return;
    el.innerHTML = this.renderWorkoutHtml(key);
  },

  /**
   * [NOVO] Gera o HTML de um plano de treino a partir da chave (3x/4x/5x/
   * 6x/casa/cardio). Extraído de _renderWorkout pra ser reaproveitado fora
   * do Guia — usado pelo botão "Ver treino" da aba Meu Plano / Home.
   */
  renderWorkoutHtml(key) {
    const workout = GUIDE_WORKOUTS[key];
    if (!workout) return '<p>Treino não encontrado.</p>';

    let html = `<div class="card" style="margin-bottom:12px;">
      <div style="font-weight:700; font-family:var(--font-display);">${workout.label}</div>
      <div class="field__hint" style="margin-top:2px;">${workout.level}</div>
    </div>`;

    if (workout.stats) {
      html += `<div class="card" style="margin-bottom:12px;">`;
      workout.stats.forEach(([label, value]) => {
        html += `<div class="guide-table__row">
          <span class="guide-table__food">${label}</span>
          <span class="guide-table__measure">${value}</span>
        </div>`;
      });
      html += `</div>`;
    }

    workout.days.forEach((d) => {
      html += `<div class="card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <span style="font-weight:700; font-family:var(--font-display);">${d.day !== '—' ? 'Dia ' + d.day + ' · ' : ''}${d.focus}</span>
        </div>
        <p class="field__hint" style="margin:8px 0;">${d.exercises}</p>
        <div class="guide-table__row" style="border-top:1px solid var(--gray-200); padding-top:8px; margin-top:4px;">
          <span class="guide-table__food">Séries × reps</span>
          <span class="guide-table__measure">${d.sets}</span>
        </div>
        <div class="guide-table__row">
          <span class="guide-table__food">Descanso</span>
          <span class="guide-table__measure">${d.rest}</span>
        </div>
      </div>`;
    });

    if (workout.note) {
      html += `<div class="notice-card"><div class="notice-list__item">${workout.note}</div></div>`;
    }

    return html;
  },
};
