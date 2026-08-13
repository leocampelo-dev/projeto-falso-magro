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

/**
 * [REVISADO] Princípios gerais de treino — aparecem uma vez por plano (não
 * repetidos em cada dia), com técnicas simples de hipertrofia voltadas pra
 * quem está começando ou é intermediário. Compartilhado entre os planos de
 * musculação (3x/4x/5x/6x/casa); cardio tem o seu próprio conjunto.
 */
const TRAINING_PRINCIPLES = [
  'Progressão de carga: aumente peso ou repetições a cada 1-2 semanas — é o que faz o músculo crescer com o tempo, não repetir sempre a mesma carga.',
  'Controle da falha: na maioria das séries, pare 1-2 repetições antes da falha técnica (perder a forma). Vá à falha total só na última série do último exercício de cada grupo muscular.',
  'Cadência: controle a descida (fase excêntrica) em 2-3 segundos — mais eficiente pra hipertrofia do que descer rápido.',
  'Aquecimento: faça 1 série leve antes da primeira série "de verdade" em exercícios compostos (supino, agachamento, remada) — não precisa aquecer isolados.',
];

const CARDIO_PRINCIPLES = [
  'Progrida aos poucos: aumente a duração ou a intensidade gradualmente a cada semana, não tudo de uma vez.',
  'Use a respiração como termômetro: se dá pra conversar em frases curtas mas não cantar, a intensidade está certa.',
  'Prefira a consistência: sessões moderadas regulares valem mais que treinos puxados de vez em quando.',
];

const GUIDE_WORKOUTS = {
  '3x': {
    label: 'Treino 3x por semana (ABC)',
    level: 'Iniciante / Intermediário',
    note: 'Frequência: A-B-C uma vez por semana, com 1 dia de descanso entre sessões quando possível.',
    principles: TRAINING_PRINCIPLES,
    days: [
      { day: 'A', focus: 'Peito / Ombro / Tríceps', exercises: [
        { name: 'Supino reto (barra ou halteres)', sets: '1 série de aquecimento leve + 3×8-12', rest: '90s' },
        { name: 'Supino inclinado com halteres', sets: '3×8-12', rest: '90s' },
        { name: 'Elevação lateral', sets: '3×12-15', rest: '60s', technique: 'Última série: rest-pause' },
        { name: 'Desenvolvimento com halteres', sets: '3×8-12', rest: '60-90s' },
        { name: 'Tríceps corda', sets: '3×12-15', rest: '60s', technique: 'Última série: drop-set' },
      ] },
      { day: 'B', focus: 'Costas / Bíceps', exercises: [
        { name: 'Puxada frente', sets: '1 série de aquecimento leve + 3×8-12', rest: '90s' },
        { name: 'Remada baixa (cabo)', sets: '3×8-12', rest: '90s' },
        { name: 'Remada unilateral (halter apoiado no banco)', sets: '3×10-12 por lado', rest: '60s' },
        { name: 'Rosca direta (barra ou halteres)', sets: '3×10-12', rest: '60s', technique: 'Última série: rest-pause' },
      ] },
      { day: 'C', focus: 'Pernas / Abdômen', exercises: [
        { name: 'Agachamento (livre ou com barra)', sets: '1 série de aquecimento leve + 3×10-12', rest: '90s' },
        { name: 'Leg press', sets: '3×10-12', rest: '90s' },
        { name: 'Cadeira extensora', sets: '3×12-15', rest: '60s', technique: 'Última série: drop-set' },
        { name: 'Mesa flexora', sets: '3×12-15', rest: '60s' },
        { name: 'Panturrilha em pé', sets: '3×15-20', rest: '45s', technique: 'Última série: rest-pause' },
        { name: 'Abdômen (prancha ou elevação de pernas)', sets: '3×15-20 (ou 30-45s de prancha)', rest: '45s' },
      ] },
    ],
  },
  '4x': {
    label: 'Treino 4x por semana (ABCD)',
    level: 'Intermediário',
    note: 'Frequência: A-B-C-D, descanso, descanso, ou distribuído conforme sua rotina.',
    principles: TRAINING_PRINCIPLES,
    days: [
      { day: 'A', focus: 'Peito / Tríceps', exercises: [
        { name: 'Supino reto (barra ou halteres)', sets: '1 série de aquecimento leve + 3×8-12', rest: '90s' },
        { name: 'Supino inclinado', sets: '3×8-12', rest: '90s' },
        { name: 'Crucifixo ou peck deck', sets: '3×12-15', rest: '60s' },
        { name: 'Tríceps testa', sets: '3×10-12', rest: '60s', technique: 'Última série: drop-set' },
      ] },
      { day: 'B', focus: 'Costas / Bíceps', exercises: [
        { name: 'Puxada frente', sets: '1 série de aquecimento leve + 3×8-12', rest: '90s' },
        { name: 'Remada curvada (barra)', sets: '3×8-12', rest: '90s' },
        { name: 'Remada cabo (sentado)', sets: '3×10-12', rest: '60s' },
        { name: 'Rosca alternada', sets: '3×10-12', rest: '60s', technique: 'Última série: rest-pause' },
      ] },
      { day: 'C', focus: 'Pernas', exercises: [
        { name: 'Agachamento (livre ou com barra)', sets: '1 série de aquecimento leve + 4×8-12', rest: '90s' },
        { name: 'Leg press', sets: '3×10-12', rest: '90s' },
        { name: 'Cadeira extensora', sets: '3×12-15', rest: '60s' },
        { name: 'Mesa flexora', sets: '3×12-15', rest: '60s' },
        { name: 'Panturrilha em pé', sets: '4×15-20', rest: '45s', technique: 'Última série: rest-pause' },
      ] },
      { day: 'D', focus: 'Ombro / Abdômen', exercises: [
        { name: 'Desenvolvimento com halteres', sets: '3×10-12', rest: '60-90s' },
        { name: 'Elevação lateral', sets: '3×12-15', rest: '60s', technique: 'Última série: drop-set' },
        { name: 'Elevação posterior (crucifixo invertido)', sets: '3×12-15', rest: '45-60s' },
        { name: 'Abdômen (3 variações: prancha, elevação de pernas, supra)', sets: '3×15-20 cada', rest: '45s' },
      ] },
    ],
  },
  '5x': {
    label: 'Treino 5x por semana (ABCDE)',
    level: 'Intermediário / Avançado',
    note: null,
    principles: TRAINING_PRINCIPLES,
    days: [
      { day: 'A', focus: 'Peito', exercises: [
        { name: 'Supino reto (barra ou halteres)', sets: '1 série de aquecimento leve + 4×8-12', rest: '90s' },
        { name: 'Supino inclinado', sets: '3×8-12', rest: '90s' },
        { name: 'Crucifixo ou peck deck', sets: '3×12-15', rest: '60s' },
        { name: 'Crossover (cabo)', sets: '3×12-15', rest: '60s', technique: 'Última série: drop-set' },
      ] },
      { day: 'B', focus: 'Costas', exercises: [
        { name: 'Puxada frente', sets: '1 série de aquecimento leve + 4×8-12', rest: '90s' },
        { name: 'Remada curvada (barra)', sets: '3×8-12', rest: '90s' },
        { name: 'Remada cabo (sentado)', sets: '3×10-12', rest: '60s' },
        { name: 'Pull-over', sets: '3×12-15', rest: '60s' },
      ] },
      { day: 'C', focus: 'Pernas', exercises: [
        { name: 'Agachamento (livre ou com barra)', sets: '1 série de aquecimento leve + 4×8-12', rest: '90s' },
        { name: 'Leg press', sets: '4×10-12', rest: '90s' },
        { name: 'Cadeira extensora', sets: '3×12-15', rest: '60s', technique: 'Última série: drop-set' },
        { name: 'Mesa flexora', sets: '3×12-15', rest: '60s' },
        { name: 'Panturrilha em pé', sets: '4×15-20', rest: '45s' },
      ] },
      { day: 'D', focus: 'Ombro', exercises: [
        { name: 'Desenvolvimento com halteres', sets: '3×10-12', rest: '60-90s' },
        { name: 'Elevação lateral', sets: '3×12-15', rest: '60s', technique: 'Última série: rest-pause' },
        { name: 'Elevação posterior (crucifixo invertido)', sets: '3×12-15', rest: '45-60s' },
        { name: 'Encolhimento (trapézio)', sets: '3×12-15', rest: '60s' },
      ] },
      { day: 'E', focus: 'Braços / Abdômen', exercises: [
        { name: 'Rosca direta (barra ou halteres)', sets: '3×10-12', rest: '60s' },
        { name: 'Rosca martelo', sets: '3×10-12', rest: '60s', technique: 'Última série: rest-pause' },
        { name: 'Tríceps corda', sets: '3×12-15', rest: '45-60s' },
        { name: 'Tríceps testa', sets: '3×10-12', rest: '45-60s', technique: 'Última série: drop-set' },
        { name: 'Abdômen (3 variações: prancha, elevação de pernas, supra)', sets: '3×15-20 cada', rest: '45s' },
      ] },
    ],
  },
  '6x': {
    label: 'Treino 6x por semana (ABC 2x)',
    level: 'Avançado',
    note: 'Mesma divisão do treino 3x, mas o ciclo roda duas vezes na semana: A-B-C-A-B-C, com 1 dia de descanso. Mesmos exercícios e faixas de repetição do plano 3x — a diferença é a frequência de estímulo por grupo muscular (2x por semana em vez de 1x). Indicado só pra quem já tem base de treino e recuperação (sono, alimentação) em dia.',
    principles: TRAINING_PRINCIPLES,
    days: [],
  },
  casa: {
    label: 'Treino em casa (3x por semana, corpo inteiro)',
    level: 'Completo, sem academia',
    note: 'Se tiver halteres ou elástico, aumente a carga progressivamente. Sem equipamento, aumente repetições ou reduza o descanso pra progredir.',
    principles: TRAINING_PRINCIPLES,
    days: [
      { day: '—', focus: 'Corpo inteiro', exercises: [
        { name: 'Agachamento livre (ou com mochila/galão de água)', sets: '4×12-15', rest: '60s' },
        { name: 'Flexão de braço', sets: '4× até quase a falha', rest: '60s', technique: 'Cansou? Passe pra versão mais fácil (joelho) na hora, sem parar — "drop-set mecânico"' },
        { name: 'Afundo alternado', sets: '3×12 por perna', rest: '60s' },
        { name: 'Remada com elástico ou toalha na porta', sets: '3×12-15', rest: '60s' },
        { name: 'Elevação de quadril', sets: '3×15', rest: '45s' },
        { name: 'Prancha abdominal', sets: '3×30-45s', rest: '45s', technique: 'Aumente o tempo em 5-10s por semana' },
        { name: 'Panturrilha em pé', sets: '3×15-20', rest: '30s' },
      ] },
    ],
  },
  cardio: {
    label: 'Cardio',
    level: 'Complemento, não substituto',
    note: 'Cardio não substitui treino de força. É um complemento pra gerar mais gasto calórico sem depender só da restrição alimentar. Intervalado é opcional, até 1x por semana. Prefira fazer depois do treino de musculação (pra não gastar energia que você precisa pro treino principal) ou bem afastado dele — por exemplo, cardio de manhã e treino à noite.',
    principles: CARDIO_PRINCIPLES,
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
   *
   * [REVISADO] Cada exercício agora tem sua própria linha com séries,
   * descanso e (quando cabe) uma técnica simples de hipertrofia — antes
   * era uma frase só com todos os exercícios do dia juntos. Um card de
   * "Princípios do treino" aparece uma vez por plano (não repetido em
   * cada dia).
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
      const exercisesHtml = d.exercises.map((ex) => `
        <div class="exercise-item">
          <div class="exercise-item__top">
            <span class="exercise-item__name">${ex.name}</span>
            <span class="exercise-item__sets">${ex.sets}</span>
          </div>
          <div class="exercise-item__meta">Descanso: ${ex.rest}</div>
          ${ex.technique ? `<div class="exercise-item__technique">💡 ${ex.technique}</div>` : ''}
        </div>
      `).join('');

      html += `<div class="card" style="margin-bottom:12px;">
        <div style="font-weight:700; font-family:var(--font-display); margin-bottom:4px;">${d.day !== '—' ? 'Dia ' + d.day + ' · ' : ''}${d.focus}</div>
        ${exercisesHtml}
      </div>`;
    });

    if (workout.principles && workout.principles.length) {
      const principlesHtml = workout.principles.map((p) => `
        <div class="notice-list__item"><span class="notice-list__bullet">!</span>${p}</div>
      `).join('');
      html += `<div class="card notice-card" style="margin-bottom:12px;">
        <div class="notice-card__title">💡 Princípios do treino</div>
        <div class="notice-list">${principlesHtml}</div>
      </div>`;
    }

    if (workout.note) {
      html += `<div class="notice-card"><div class="notice-list__item">${workout.note}</div></div>`;
    }

    return html;
  },
};
