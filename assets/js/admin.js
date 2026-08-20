/**
 * admin.js
 * Painel administrativo simples: liberar acesso manual por e-mail e
 * gerenciar clientes existentes (legado, baseado em código).
 * Toda operação privilegiada acontece via Edge Functions (admin-clients,
 * admin-grant-access) protegidas por app_metadata.role === "admin" no backend.
 */

const AdminPanel = {
  _loaded: false,

  init() {
    this._bindGrantForm();
  },

  /** Chamado toda vez que a view admin é aberta */
  onEnter() {
    this._loadClients();
  },

  _bindGrantForm() {
    const form = document.getElementById('adminGrantForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('adminGrantEmail');
      const notesInput = document.getElementById('adminGrantNotes');
      const btn = document.getElementById('adminGrantBtn');
      const resultEl = document.getElementById('adminGrantResult');

      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        Toast.show('Digite um e-mail válido.', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Liberando...';

      try {
        const result = await SupabaseClient.adminGrantAccess(email, notesInput.value.trim());
        resultEl.style.display = 'block';
        resultEl.textContent = `Acesso liberado para ${result.email}. Peça pra ele(a) acessar /ativar com esse e-mail.`;
        Toast.show('Acesso liberado com sucesso!', 'success');
        emailInput.value = '';
        notesInput.value = '';
      } catch (err) {
        Toast.show(err.message || 'Não foi possível liberar o acesso.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Liberar acesso';
      }
    });
  },

  async _loadClients() {
    const listEl = document.getElementById('adminClientsList');
    const emptyEl = document.getElementById('adminClientsEmpty');
    const loadingEl = document.getElementById('adminClientsLoading');

    listEl.innerHTML = '';
    emptyEl.style.display = 'none';
    loadingEl.style.display = 'block';

    try {
      const clients = await SupabaseClient.adminListClients();
      loadingEl.style.display = 'none';

      if (!clients.length) {
        emptyEl.style.display = 'block';
        return;
      }

      listEl.innerHTML = clients.map((c) => this._renderClientRow(c)).join('');
      this._bindClientActions(listEl, clients);
    } catch (err) {
      loadingEl.style.display = 'none';
      Toast.show(err.message || 'Não foi possível carregar os clientes.', 'error');
    }
  },

  _statusLabel(status) {
    const map = {
      pending_activation: 'Aguardando ativação',
      active: 'Ativo',
      blocked: 'Bloqueado',
      expired: 'Expirado',
    };
    return map[status] || status;
  },

  _sourceLabel(source) {
    const map = { kiwify: 'Kiwify', manual: 'Manual' };
    return map[source] || source;
  },

  _renderClientRow(c) {
    const created = new Date(c.createdAt).toLocaleDateString('pt-BR');
    const purchased = c.purchasedAt ? new Date(c.purchasedAt).toLocaleDateString('pt-BR') : '—';

    return `
      <div class="admin-client-row" data-user-id="${c.userId}">
        <div class="admin-client-row__main">
          <div class="admin-client-row__code">${c.email}</div>
          <div class="admin-client-row__meta">${c.name} · origem: ${this._sourceLabel(c.source)} · compra em ${purchased} · conta criada em ${created}</div>
        </div>
        <span class="admin-client-row__status admin-client-row__status--${c.status}">${this._statusLabel(c.status)}</span>
        <div class="admin-client-row__actions">
          ${c.status === 'blocked'
            ? `<button type="button" class="btn btn--secondary btn--sm" data-admin-action="reactivate">Reativar</button>`
            : `<button type="button" class="btn btn--secondary btn--sm" data-admin-action="block">Bloquear</button>`
          }
          <button type="button" class="btn btn--ghost btn--sm" data-admin-action="reset">Resetar progresso</button>
          <button type="button" class="btn btn--danger btn--sm" data-admin-action="delete">Excluir</button>
        </div>
      </div>
    `;
  },

  _bindClientActions(listEl) {
    listEl.querySelectorAll('[data-admin-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.admin-client-row');
        const userId = row.dataset.userId;
        const action = btn.dataset.adminAction;
        this._handleClientAction(userId, action);
      });
    });
  },

  async _handleClientAction(userId, action) {
    try {
      if (action === 'block' || action === 'reactivate') {
        await SupabaseClient.adminSetClientStatus(userId, action);
        Toast.show(action === 'block' ? 'Acesso bloqueado.' : 'Acesso reativado.', 'success');
        this._loadClients();
        return;
      }

      if (action === 'reset') {
        const confirmed = window.confirm('Tem certeza que deseja resetar todo o progresso deste cliente? Esta ação não pode ser desfeita.');
        if (!confirmed) return;

        await SupabaseClient.adminResetClient(userId);
        Toast.show('Progresso resetado.', 'success');
        this._loadClients();
        return;
      }

      if (action === 'delete') {
        const firstConfirm = window.confirm('Tem certeza que deseja excluir este cliente permanentemente? Todos os dados dele (nome, metas e check-ins) serão apagados. O histórico da compra é mantido para auditoria.');
        if (!firstConfirm) return;

        const secondConfirm = window.confirm('Confirmação final: esta ação NÃO pode ser desfeita. Deseja realmente excluir este cliente?');
        if (!secondConfirm) return;

        await SupabaseClient.adminDeleteClient(userId);
        Toast.show('Cliente excluído permanentemente.', 'success');
        this._loadClients();
      }
    } catch (err) {
      Toast.show(err.message || 'Não foi possível concluir a ação.', 'error');
    }
  },
};
