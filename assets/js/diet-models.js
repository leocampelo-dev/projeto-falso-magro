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
};
