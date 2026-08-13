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
 *
 * Cada substituição tem `food` (nome) e `qty` (quantidade equivalente em
 * grama + medida caseira, calculada pra bater aproximadamente calorias E
 * macros com o alimento original — não só o macro principal). A base de
 * cálculo usada foi a quantidade do alimento original no modelo de 2000
 * kcal (o "meio-termo" dos 4 planos); como a porção do alimento original
 * varia um pouco entre os 4 modelos (1600 a 2200 kcal), a equivalência é
 * uma referência prática pros 4, não uma prescrição exata por plano.
 */
const FOOD_SUBSTITUTIONS = {
  'Ovos inteiros mexidos': [
    { food: 'Ovos + queijo coalho ou mussarela', qty: '2 ovos + 50g de queijo' },
    { food: 'Omelete com queijo cottage', qty: '3 ovos + 70g de queijo cottage' },
    { food: 'Whey protein + aveia', qty: '1 dose (30g) whey + 2 colheres de sopa (20g) aveia' },
  ],
  'Pão integral': [
    { food: 'Tapioca', qty: '2 colheres de sopa (30g) de goma' },
    { food: 'Aveia em flocos', qty: '3 colheres de sopa (30g)' },
    { food: 'Batata-doce cozida', qty: '1 pedaço médio (80g)' },
    { food: 'Cuscuz de milho cozido', qty: '115g (≈4 colheres de sopa)' },
  ],
  'Pasta de amendoim': [
    { food: 'Pasta de amêndoas', qty: '1 colher de sopa (16g)' },
    { food: 'Abacate amassado', qty: '3 colheres de sopa (50g)' },
    { food: 'Castanhas trituradas', qty: '2-3 unidades (10g)' },
    { food: 'Amendoim grão torrado', qty: '17g (≈12-15 grãos)' },
  ],
  'Banana': [
    { food: 'Maçã', qty: '1 unidade média (130g)' },
    { food: 'Mamão', qty: '1 fatia grande (150g)' },
    { food: 'Manga', qty: '½ unidade pequena (80g)' },
    { food: 'Uva', qty: '≈130g (uma taça pequena / 20-24 unidades)' },
  ],
  'Frango grelhado': [
    { food: 'Carne magra (patinho/coxão)', qty: '160g' },
    { food: 'Peixe branco', qty: '180g' },
    { food: 'Whey protein', qty: '70g' },
  ],
  'Arroz branco ou integral': [
    { food: 'Batata-doce', qty: '200g' },
    { food: 'Batata inglesa', qty: '180g' },
    { food: 'Macarrão', qty: '120g cozido' },
    { food: 'Mandioca', qty: '130g' },
    { food: 'Cuscuz de milho cozido', qty: '170g' },
  ],
  'Feijão': [
    { food: 'Lentilha', qty: '1 concha (90g)' },
    { food: 'Grão-de-bico', qty: '1 concha (90g)' },
    { food: 'Ervilha', qty: '1 concha (100g)' },
  ],
  'Salada crua': [
    { food: 'Legumes no vapor', qty: 'à vontade' },
    { food: 'Legumes refogados', qty: 'à vontade' },
  ],
  'Azeite': [
    { food: 'Castanhas', qty: '1 unidade (5g)' },
    { food: 'Abacate', qty: '1 fatia fina (15g)' },
  ],
  'Iogurte natural': [
    { food: 'Queijo cottage', qty: '100g (≈4 colheres de sopa)' },
    { food: 'Whey protein batido', qty: '1 dose (30g) + 200ml água ou leite' },
  ],
  'Aveia': [
    { food: 'Granola sem açúcar', qty: '2 colheres de sopa (25g)' },
    { food: 'Quinoa em flocos', qty: '3 colheres de sopa (30g)' },
  ],
  'Castanhas': [
    { food: 'Amêndoas', qty: '15 unidades (25g)' },
    { food: 'Nozes', qty: '5 metades (25g)' },
    { food: 'Pasta de amendoim', qty: '1 colher de sopa (16g)' },
  ],
  'Carne magra ou peixe': [
    { food: 'Frango grelhado', qty: '185g' },
    { food: 'Whey protein', qty: '72g' },
  ],
  'Batata-doce': [
    { food: 'Arroz', qty: '5 colheres de sopa (140g)' },
    { food: 'Batata inglesa', qty: '180g' },
    { food: 'Mandioca', qty: '120g' },
    { food: 'Cuscuz de milho cozido', qty: '125g' },
    { food: 'Macarrão', qty: '90g cozido' },
  ],
  'Legumes refogados': [
    { food: 'Salada crua', qty: 'à vontade' },
    { food: 'Legumes no vapor', qty: 'à vontade' },
  ],
  'Mel': [
    { food: 'Geleia sem açúcar', qty: '1 colher de chá (7g)' },
    { food: 'Melado de cana', qty: '1 colher de chá (7g)' },
  ],
  'Batata-doce ou arroz': [
    { food: 'Mandioca', qty: '150g' },
    { food: 'Macarrão', qty: '97g cozido' },
    { food: 'Cuscuz de milho cozido', qty: '137g' },
  ],
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

  /**
   * [REVISADO — item 9] O card "Substituições por grupo" que existia aqui
   * (genérico, sem quantidade: "Frango ↔ carne ↔ ovo...") foi removido —
   * ficou redundante e menos preciso que as substituições específicas por
   * alimento (clicáveis, com quantidade equivalente) que já aparecem em
   * cada item de refeição acima. No lugar dele entram as orientações
   * gerais combinadas com o usuário.
   */
  orientations: [
    'Exclua o consumo de açúcar — use adoçantes como Stevia ou Sucralose.',
    'Refeição livre: 1x por semana, de forma controlada. Se descontrolar ou virar o dia inteiro, compromete o déficit da semana toda.',
  ],

  get(kcal) {
    return this[kcal] || null;
  },

  /**
   * [NOVO — Fase 5] Monta o HTML das refeições + orientações gerais de um
   * modelo, reaproveitando o mesmo estilo de linha (guide-table__row) do
   * Guia. Usado pelo onboarding (Passo 2) e pela Home ("Ver alimentação"),
   * pra não duplicar essa marcação em dois arquivos.
   */
  renderHtml(model) {
    const mealsHtml = model.meals.map((meal) => `
      <div class="onb-meal-block">
        <div class="onb-meal-block__title">${meal.title}</div>
        ${meal.items.map((item) => this._renderMealItemRow(item)).join('')}
      </div>
    `).join('');

    const orientationsHtml = this.orientations.map((o) => `
      <div class="notice-list__item"><span class="notice-list__bullet">!</span>${o}</div>
    `).join('');

    return `
      <div class="card notice-card" style="margin-bottom: var(--space-4);">
        <div class="notice-card__title">⚠️ Antes de montar seu prato</div>
        <div class="notice-list">${orientationsHtml}</div>
      </div>
      ${mealsHtml}
    `;
  },

  /**
   * [NOVO — item 9] Uma linha de item de refeição. Se o alimento tiver
   * substituições cadastradas em FOOD_SUBSTITUTIONS, a linha vira clicável
   * (ícone 🔁) e abre o modal via Substitutions.open(). Alimentos sem
   * substituição cadastrada continuam como uma linha simples, sem ação.
   *
   * Se o usuário já tiver trocado esse alimento antes (Storage.getFoodSwap
   * retorna {food, qty}), a linha mostra o alimento E A QUANTIDADE
   * escolhidos no lugar do original — mas data-food continua sendo o
   * original, porque é ele que indexa FOOD_SUBSTITUTIONS (a lista de
   * alternativas é sempre a mesma, independente de qual delas está ativa).
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

    const activeSwap = Storage.getFoodSwap(item.food);
    const displayFood = activeSwap ? activeSwap.food : item.food;
    const displayQty = activeSwap ? activeSwap.qty : item.qty;
    const swapNote = activeSwap ? ' <span class="guide-table__swap-tag">trocado</span>' : '';

    const subsAttr = JSON.stringify(subs).replace(/"/g, '&quot;');
    return `
      <div class="guide-table__row guide-table__row--clickable" role="button" tabindex="0" data-food="${item.food}" data-subs="${subsAttr}">
        <span class="guide-table__food">${displayFood}${swapNote} <span class="guide-table__sub-icon" title="Ver substituições">🔁</span></span>
        <span class="guide-table__qty">${displayQty}</span>
      </div>
    `;
  },
};
