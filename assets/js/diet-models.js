/**
 * diet-models.js
 * Conteúdo dos modelos de alimentação (1600 / 1800 / 2000 / 2200 kcal):
 * refeições, quantidades e substituições.
 *
 * Usado no Passo 2 do onboarding (botão "Ver modelo") e pensado pra ser
 * reaproveitado depois no botão "Ver alimentação" da Home (Fase 5) — por
 * isso fica isolado num arquivo próprio, sem depender do onboarding.js.
 *
 * IMPORTANTE sobre as macros: os números exibidos nos cards de escolha do
 * Passo 2 (e o lembrete "Sua meta") já usam a proteína REAL calculada pra
 * cada usuário (Calculator/Storage). As quantidades abaixo são um modelo
 * de referência prático — um jeito de montar o dia — não uma prescrição
 * gramada pra cada indivíduo.
 */

/**
 * [NOVO — item 9] Substituições específicas por alimento (não por grupo),
 * usadas pelo modal que abre ao clicar num item da dieta. Fica num mapa só
 * (por nome do alimento) em vez de repetir a lista dentro de cada refeição
 * de cada um dos 4 modelos — os mesmos alimentos se repetem entre as dietas
 * de 1600 a 2200 kcal, então centralizar aqui evita duplicar 4x a mesma
 * informação. Alimentos sem entrada aqui (ex: "à vontade") não ficam
 * clicáveis — não faz sentido sugerir substituição pra eles.
 */
const FOOD_SUBSTITUTIONS = {
  'Ovos inteiros mexidos': ['Claras (dobro da quantidade)', 'Omelete com queijo cottage', 'Whey protein + aveia'],
  'Pão integral': ['Tapioca', 'Aveia em flocos', 'Batata-doce cozida'],
  'Pasta de amendoim': ['Pasta de amêndoas', 'Abacate amassado', 'Castanhas trituradas'],
  'Banana': ['Maçã', 'Mamão', 'Manga (porção menor)'],
  'Frango grelhado': ['Carne magra (patinho/coxão)', 'Peixe branco', 'Ovos (dobro em unidades)', 'Whey protein'],
  'Arroz branco ou integral': ['Batata-doce', 'Batata inglesa', 'Macarrão', 'Mandioca'],
  'Feijão': ['Lentilha', 'Grão-de-bico', 'Ervilha'],
  'Salada crua': ['Legumes no vapor', 'Legumes refogados'],
  'Azeite': ['Castanhas (1 punhado pequeno)', 'Abacate (1 fatia)'],
  'Iogurte natural': ['Queijo cottage', 'Whey protein batido com água ou leite'],
  'Aveia': ['Granola sem açúcar', 'Quinoa em flocos'],
  'Castanhas': ['Amêndoas', 'Nozes', 'Pasta de amendoim (1 colher)'],
  'Carne magra ou peixe': ['Frango grelhado', 'Ovos', 'Whey protein'],
  'Batata-doce': ['Arroz', 'Batata inglesa', 'Mandioca'],
  'Legumes refogados': ['Salada crua', 'Legumes no vapor'],
  'Mel': ['Geleia sem açúcar', 'Melado de cana (pequena quantidade)'],
  'Batata-doce ou arroz': ['Mandioca', 'Macarrão'],
};

const DietModels = {
  1600: {
    meals: [
      {
        title: 'Café da manhã',
        items: [
          { food: 'Ovos inteiros mexidos', qty: '3 un' },
          { food: 'Pão integral', qty: '2 fatias' },
          { food: 'Banana', qty: '1 unidade pequena' },
        ],
      },
      {
        title: 'Almoço',
        items: [
          { food: 'Frango grelhado', qty: '150g' },
          { food: 'Arroz branco ou integral', qty: '4 colheres de sopa' },
          { food: 'Salada crua', qty: 'à vontade' },
          { food: 'Azeite', qty: '1 fio' },
        ],
      },
      {
        title: 'Lanche da tarde',
        items: [
          { food: 'Iogurte natural', qty: '1 pote (170g)' },
          { food: 'Castanhas', qty: '1 punhado (20g)' },
        ],
      },
      {
        title: 'Jantar',
        items: [
          { food: 'Carne magra ou peixe', qty: '150g' },
          { food: 'Batata-doce', qty: '100g' },
          { food: 'Legumes refogados', qty: 'à vontade' },
        ],
      },
    ],
  },

  1800: {
    meals: [
      {
        title: 'Café da manhã',
        items: [
          { food: 'Ovos inteiros mexidos', qty: '3 un' },
          { food: 'Pão integral', qty: '2 fatias' },
          { food: 'Pasta de amendoim', qty: '1 colher de sopa' },
          { food: 'Banana', qty: '1 unidade' },
        ],
      },
      {
        title: 'Almoço',
        items: [
          { food: 'Frango grelhado', qty: '170g' },
          { food: 'Arroz branco ou integral', qty: '5 colheres de sopa' },
          { food: 'Feijão', qty: '1 concha' },
          { food: 'Salada crua', qty: 'à vontade' },
        ],
      },
      {
        title: 'Lanche da tarde',
        items: [
          { food: 'Iogurte natural', qty: '1 pote (170g)' },
          { food: 'Aveia', qty: '2 colheres de sopa' },
          { food: 'Castanhas', qty: '1 punhado (20g)' },
        ],
      },
      {
        title: 'Jantar',
        items: [
          { food: 'Carne magra ou peixe', qty: '170g' },
          { food: 'Batata-doce', qty: '150g' },
          { food: 'Legumes refogados', qty: 'à vontade' },
        ],
      },
    ],
  },

  2000: {
    meals: [
      {
        title: 'Café da manhã',
        items: [
          { food: 'Ovos inteiros mexidos', qty: '4 un' },
          { food: 'Pão integral', qty: '2 fatias' },
          { food: 'Pasta de amendoim', qty: '1 colher de sopa' },
          { food: 'Banana', qty: '1 unidade' },
        ],
      },
      {
        title: 'Almoço',
        items: [
          { food: 'Frango grelhado', qty: '180g' },
          { food: 'Arroz branco ou integral', qty: '6 colheres de sopa' },
          { food: 'Feijão', qty: '1 concha' },
          { food: 'Salada crua', qty: 'à vontade' },
          { food: 'Azeite', qty: '1 fio' },
        ],
      },
      {
        title: 'Lanche da tarde',
        items: [
          { food: 'Iogurte natural', qty: '1 pote (170g)' },
          { food: 'Aveia', qty: '3 colheres de sopa' },
          { food: 'Castanhas', qty: '1 punhado (25g)' },
        ],
      },
      {
        title: 'Jantar',
        items: [
          { food: 'Carne magra ou peixe', qty: '180g' },
          { food: 'Batata-doce', qty: '180g' },
          { food: 'Legumes refogados', qty: 'à vontade' },
        ],
      },
    ],
  },

  2200: {
    meals: [
      {
        title: 'Café da manhã',
        items: [
          { food: 'Ovos inteiros mexidos', qty: '4 un' },
          { food: 'Pão integral', qty: '3 fatias' },
          { food: 'Pasta de amendoim', qty: '1 colher de sopa' },
          { food: 'Banana', qty: '1 unidade grande' },
        ],
      },
      {
        title: 'Almoço',
        items: [
          { food: 'Frango grelhado', qty: '200g' },
          { food: 'Arroz branco ou integral', qty: '7 colheres de sopa' },
          { food: 'Feijão', qty: '1 concha cheia' },
          { food: 'Salada crua', qty: 'à vontade' },
          { food: 'Azeite', qty: '1 fio' },
        ],
      },
      {
        title: 'Lanche da tarde',
        items: [
          { food: 'Iogurte natural', qty: '1 pote (170g)' },
          { food: 'Aveia', qty: '3 colheres de sopa' },
          { food: 'Mel', qty: '1 colher de chá' },
          { food: 'Castanhas', qty: '1 punhado (30g)' },
        ],
      },
      {
        title: 'Jantar',
        items: [
          { food: 'Carne magra ou peixe', qty: '200g' },
          { food: 'Batata-doce ou arroz', qty: '200g' },
          { food: 'Legumes refogados', qty: 'à vontade' },
        ],
      },
    ],
  },

  /** Substituições equivalentes, iguais para os 4 modelos. */
  substitutions: [
    { group: 'Proteínas', items: 'Frango ↔ carne magra ↔ peixe ↔ ovos ↔ whey protein' },
    { group: 'Carboidratos', items: 'Arroz ↔ batata-doce ↔ batata inglesa ↔ macarrão ↔ pão integral' },
    { group: 'Gorduras', items: 'Azeite ↔ castanhas ↔ pasta de amendoim ↔ abacate' },
    { group: 'Vegetais', items: 'Livre entre folhas, legumes e verduras — quanto mais colorido, melhor' },
  ],

  get(kcal) {
    return this[kcal] || null;
  },

  /**
   * [NOVO — Fase 5] Monta o HTML das refeições + substituições de um modelo,
   * reaproveitando o mesmo estilo de linha (guide-table__row) do Guia.
   * Usado pelo onboarding (Passo 2) e pela Home ("Ver alimentação"), pra não
   * duplicar essa marcação em dois arquivos.
   */
  renderHtml(model) {
    const mealsHtml = model.meals.map((meal) => `
      <div class="onb-meal-block">
        <div class="onb-meal-block__title">${meal.title}</div>
        ${meal.items.map((item) => this._renderMealItemRow(item)).join('')}
      </div>
    `).join('');

    const subsHtml = this.substitutions.map((s) => `
      <div class="guide-table__row">
        <span class="guide-table__food">${s.group}</span>
        <span class="guide-table__measure">${s.items}</span>
      </div>
    `).join('');

    return `
      ${mealsHtml}
      <div class="onb-meal-block">
        <div class="onb-meal-block__title">Substituições por grupo</div>
        ${subsHtml}
      </div>
    `;
  },

  /**
   * [NOVO — item 9] Uma linha de item de refeição. Se o alimento tiver
   * substituições cadastradas em FOOD_SUBSTITUTIONS, a linha vira clicável
   * (ícone 🔁) e abre o modal via Substitutions.open(). Alimentos sem
   * substituição cadastrada continuam como uma linha simples, sem ação.
   */
  _renderMealItemRow(item) {
    const subs = FOOD_SUBSTITUTIONS[item.food];

    if (!subs || !subs.length) {
      return `
        <div class="guide-table__row">
          <span class="guide-table__food">${item.food}</span>
          <span class="guide-table__qty">${item.qty}</span>
        </div>
      `;
    }

    const subsAttr = JSON.stringify(subs).replace(/"/g, '&quot;');
    return `
      <div class="guide-table__row guide-table__row--clickable" role="button" tabindex="0" data-food="${item.food}" data-subs="${subsAttr}">
        <span class="guide-table__food">${item.food} <span class="guide-table__sub-icon" title="Ver substituições">🔁</span></span>
        <span class="guide-table__qty">${item.qty}</span>
      </div>
    `;
  },
};
