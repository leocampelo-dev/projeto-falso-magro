/**
 * mini-loader.js
 * Overlay de loading curtinho com mensagens alternando, pra dar a sensação
 * de "o app está trabalhando pra mim" nos momentos de calcular/configurar.
 *
 * Uso:
 *   await MiniLoader.show(['Calculando suas calorias 🔥', 'Quase lá...'], 1600);
 *   // ... segue o fluxo depois que a Promise resolve
 */

const MiniLoader = {
  _el: null,
  _msgEl: null,
  _timer: null,

  _ensureEl() {
    if (this._el) return;
    const el = document.createElement('div');
    el.className = 'mini-loader-overlay';
    el.innerHTML = `
      <div class="mini-loader">
        <div class="mini-loader__spinner"></div>
        <div class="mini-loader__msg" id="miniLoaderMsg"></div>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;
    this._msgEl = el.querySelector('#miniLoaderMsg');
  },

  /**
   * Mostra o overlay alternando entre as mensagens recebidas e resolve
   * a Promise depois de `duration` ms (o cálculo/gravação real pode
   * continuar rodando por trás, isso é só a experiência visual).
   */
  show(messages, duration = 1600) {
    this._ensureEl();
    clearInterval(this._timer);

    this._el.classList.add('is-visible');
    this._msgEl.textContent = messages[0] || '';

    let i = 0;
    const interval = Math.max(Math.floor(duration / messages.length), 550);
    this._timer = setInterval(() => {
      i = (i + 1) % messages.length;
      this._msgEl.textContent = messages[i];
    }, interval);

    return new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(this._timer);
        resolve();
      }, duration);
    });
  },

  hide() {
    if (!this._el) return;
    this._el.classList.remove('is-visible');
    clearInterval(this._timer);
  },
};
