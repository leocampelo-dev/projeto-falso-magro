/**
 * app.js
 * Ponto de entrada da aplicação: utilitários gerais, navegação entre telas,
 * toasts, modal da calculadora, autenticação por código, painel admin e
 * inicialização.
 */

/* ============================================================
   UTILS
   ============================================================ */
const Utils = {
  getDateKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /** Retorna o número do dia do desafio (1-based) a partir da data de início */
  getCurrentChallengeDay(startDateKey, referenceDate = new Date()) {
    const start = new Date(`${startDateKey}T00:00:00`);
    const now = new Date(Utils.getDateKey(referenceDate) + 'T00:00:00');
    const diffMs = now - start;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  },

  formatDateLabel(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  },
};

/* ============================================================
   TOAST
   ============================================================ */
const Toast = {
  _stack: null,

  init() {
    this._stack = document.getElementById('toastStack');
  },

  show(message, type = 'success') {
    if (!this._stack) return;

    const icons = { success: '✅', error: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span class="toast__icon">${icons[type] || '✅'}</span><span>${message}</span>`;

    this._stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 350);
    }, 2600);
  },
};

/* ============================================================
   APP — navegação e orquestração geral
   ============================================================ */
const App = {
  currentView: 'dashboard',

  init() {
    Toast.init();
    this._bindNav();
    this._bindAuthScreen();
    this._bindAdminLoginScreen();
    this._bindWelcomeScreen();
    this._bindCalculatorModal();
    this._bindSignOut();
    this._bindConnectivity();
    Checkin.init();
    AdminPanel.init();
    this._registerServiceWorker();
    this._boot();
  },

  /* ---------- Fluxo inicial ---------- */
  async _boot() {
    await Auth.refreshSession();

    document.getElementById('splash').classList.add('is-hidden');

    if (!Auth.isAuthenticated()) {
      this._showScreen('screenAuth');
      return;
    }

    await this._syncAndEnter();
  },

  async _syncAndEnter() {
    Storage.setUserId(Auth.getUserId());
    const syncResult = await Storage.syncFromRemote(Auth.getUserId());

    if (!syncResult.ok && !Storage.hasUser()) {
      // Sem internet e sem cache local: não há como continuar.
      Toast.show('Não foi possível conectar. Verifique sua internet e tente novamente.', 'error');
      this._showScreen('screenAuth');
      return;
    }

    if (!Storage.hasUser()) {
      this._showScreen('screenWelcome');
      return;
    }

    this._enterApp();
  },

  _showScreen(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('is-active'));
    document.getElementById(id).classList.add('is-active');
  },

  _enterApp() {
    this._showScreen('screenMain');
    this._applyAdminVisibility();
    this.goToView('dashboard');
    Dashboard.render();
    Progress.render();
    History.render();
    this.renderSyncStatus();
  },

  _applyAdminVisibility() {
    const isAdmin = Auth.isAdmin();
    const sidebarBtn = document.getElementById('navAdminSidebar');
    const panelLink = document.getElementById('adminPanelLink');
    if (sidebarBtn) sidebarBtn.style.display = isAdmin ? '' : 'none';
    if (panelLink) panelLink.style.display = isAdmin ? '' : 'none';
  },

  /* ---------- Tela de código de acesso ---------- */
  _bindAuthScreen() {
    const form = document.getElementById('authForm');
    const input = document.getElementById('authCodeInput');
    const errorEl = document.getElementById('authError');
    const submitBtn = document.getElementById('authSubmitBtn');
    const adminToggle = document.getElementById('authAdminToggle');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando...';

      const result = await Auth.redeemAccessCode(input.value);

      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar no desafio';

      if (!result.ok) {
        errorEl.textContent = result.error;
        input.value = '';
        input.focus();
        return;
      }

      await this._syncAndEnter();
    });

    adminToggle.addEventListener('click', () => this._showScreen('screenAdminLogin'));
  },

  /* ---------- Tela de login admin ---------- */
  _bindAdminLoginScreen() {
    const form = document.getElementById('adminLoginForm');
    const input = document.getElementById('adminCodeInput');
    const errorEl = document.getElementById('adminLoginError');
    const backToggle = document.getElementById('adminBackToggle');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';

      const result = await Auth.adminLogin(input.value);

      if (!result.ok) {
        errorEl.textContent = result.error;
        input.value = '';
        input.focus();
        return;
      }

      await this._syncAndEnter();
    });

    backToggle.addEventListener('click', () => this._showScreen('screenAuth'));
  },

  /* ---------- Tela de boas-vindas (onboarding) ---------- */
  _bindWelcomeScreen() {
    const form = document.getElementById('welcomeForm');
    const input = document.getElementById('welcomeNameInput');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const user = {
        name,
        startDate: Utils.getDateKey(new Date()),
        completionShown: false,
      };

      const result = await Storage.saveUser(user);
      submitBtn.disabled = false;

      if (result.ok) {
        Toast.show(`Bem-vindo, ${name}!`, 'success');
      } else {
        Toast.show('Salvo neste dispositivo. Sincronizando assim que a internet voltar.', 'error');
      }

      this._enterApp();
    });
  },

  /* ---------- Sair da conta ---------- */
  _bindSignOut() {
    const btn = document.getElementById('signOutBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      await Auth.signOut();
      document.getElementById('authCodeInput').value = '';
      document.getElementById('authError').textContent = '';
      this._showScreen('screenAuth');
    });
  },

  /* ---------- Status de sincronização ---------- */
  renderSyncStatus() {
    const el = document.getElementById('syncStatus');
    if (!el) return;

    if (!navigator.onLine) {
      el.textContent = '⚠ Salvo neste dispositivo — sincronização pendente';
      el.classList.add('sync-status--pending');
      return;
    }

    if (Storage.hasPendingSync()) {
      el.textContent = '⚠ Sincronização pendente';
      el.classList.add('sync-status--pending');
    } else {
      el.textContent = '✓ Progresso salvo na nuvem';
      el.classList.remove('sync-status--pending');
    }
  },

  /* ---------- Conectividade (sync automático ao voltar online) ---------- */
  _bindConnectivity() {
    window.addEventListener('online', async () => {
      if (!Auth.isAuthenticated()) return;
      const result = await Storage.syncPending();
      this.renderSyncStatus();
      if (result && result.ok) {
        Toast.show('Dados sincronizados com sucesso.', 'success');
        Dashboard.render();
        Progress.render();
        History.render();
      }
    });

    window.addEventListener('offline', () => this.renderSyncStatus());
  },

  /* ---------- Navegação entre views ---------- */
  _bindNav() {
    document.querySelectorAll('[data-nav-target]').forEach((btn) => {
      btn.addEventListener('click', () => this.goToView(btn.dataset.navTarget));
    });

    document.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => this._handleAction(btn.dataset.action));
    });
  },

  goToView(viewName) {
    this.currentView = viewName;

    document.querySelectorAll('.view').forEach((el) => el.classList.remove('is-active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('is-active');

    document.querySelectorAll('[data-nav-target]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.navTarget === viewName);
    });

    const headerTitles = {
      dashboard: 'Início',
      checkin: 'Check-in diário',
      history: 'Histórico',
      progress: 'Progresso',
      guide: 'Guia Completo',
      admin: 'Painel administrativo',
    };
    const headerTitleEl = document.getElementById('appHeaderTitle');
    if (headerTitleEl) headerTitleEl.textContent = headerTitles[viewName] || '';

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    if (viewName === 'history') History.render();
    if (viewName === 'progress') Progress.render();
    if (viewName === 'admin') AdminPanel.onEnter();
  },

  _handleAction(action) {
    if (action === 'save-checkin') Checkin.save();
    if (action === 'open-calculator') this._openCalculatorModal();
    if (action === 'open-guide') this._openGuide();
  },

  /* ---------- Guia em PDF ---------- */
  _openGuide() {
    window.open('pdf/guia.pdf', '_blank', 'noopener');
  },

  /* ---------- Modal da calculadora ---------- */
  _bindCalculatorModal() {
    const overlay = document.getElementById('calculatorOverlay');
    const closeBtn = document.getElementById('calculatorCloseBtn');
    const form = document.getElementById('calculatorForm');

    closeBtn.addEventListener('click', () => this._closeCalculatorModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeCalculatorModal();
    });

    document.querySelectorAll('#calculatorForm [data-option-group]').forEach((group) => {
      group.querySelectorAll('.option-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          group.querySelectorAll('.option-chip').forEach((c) => c.classList.remove('is-selected'));
          chip.classList.add('is-selected');
          group.dataset.value = chip.dataset.value;
        });
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submitCalculator();
    });
  },

  _openCalculatorModal() {
    document.getElementById('calculatorOverlay').classList.add('is-visible');
  },

  _closeCalculatorModal() {
    document.getElementById('calculatorOverlay').classList.remove('is-visible');
  },

  async _submitCalculator() {
    const sexGroup = document.querySelector('[data-option-group="sex"]');
    const activityGroup = document.querySelector('[data-option-group="activity"]');

    const sex = sexGroup?.dataset.value;
    const activityLevel = activityGroup?.dataset.value;

    const age = document.getElementById('calcAge').value;
    const weight = document.getElementById('calcWeight').value;
    const height = document.getElementById('calcHeight').value;

    if (!sex || !activityLevel || !age || !weight || !height) {
      Toast.show('Preencha todos os campos para calcular.', 'error');
      return;
    }

    const goals = Calculator.calculateGoals({ sex, age, weight, height, activityLevel });
    const result = await Storage.saveGoals(goals);

    this._closeCalculatorModal();

    if (result.ok) {
      Toast.show('Metas calculadas e salvas com sucesso!', 'success');
    } else {
      Toast.show('Metas calculadas. Salvas neste dispositivo — sincronização pendente.', 'error');
    }

    Dashboard.render();
    Progress.render();
    this.renderSyncStatus();
  },

  /* ---------- Tela de conclusão do desafio ---------- */
  showCompletionScreen() {
    this._showScreen('screenComplete');
  },

  backToApp() {
    this._showScreen('screenMain');
    this.goToView('dashboard');
  },

  /* ---------- PWA ---------- */
  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch((err) => {
          console.warn('Falha ao registrar o Service Worker:', err);
        });
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
