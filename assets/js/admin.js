/**
 * admin.js
 * Painel administrativo simples: gerar códigos de acesso e gerenciar clientes.
 * Toda operação privilegiada acontece via Edge Functions (admin-clients,
 * generate-access-code) protegidas por app_metadata.role === "admin" no backend.
 */

const AdminPanel = {
  _loaded: false,

  init() {
    this._bindGenerateButton();
  },

  /** Chamado toda vez que a view admin é aberta */
  onEnter() {
    this._loadClients();
  },

  _bindGenerateButton() {
    const btn = document.getElementById('adminGenerateBtn');
    const copyBtn = document.getElementById('adminCopyBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Gerando...';

      try {
        const code = await SupabaseClient.generateAccessCode();
        document.getElementById('adminGeneratedCode').textContent = code;
        document.getElementById('adminGeneratedCard').style.display = 'flex';
        Toast.show('Código gerado com sucesso!', 'success');
        this._loadClients();
      } catch (err) {
        Toast.show(err.message || 'Não foi possível gerar o código.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '+ Gerar novo código';
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const code = document.getElementById('adminGeneratedCode').textContent;
        try {
          await navigator.clipboard.writeText(code);
          Toast.show('Código copiado!', 'success');
        } catch (err) {
          Toast.show('Não foi possível copiar automaticamente. Copie manualmente.', 'error');
        }
      });
    }
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
      active: 'Aguardando 1º acesso',
      used: 'Ativo',
      blocked: 'Bloqueado',
      expired: 'Expirado',
    };
    return map[status] || status;
  },

  _renderClientRow(c) {
    const created = new Date(c.createdAt).toLocaleDateString('pt-BR');
    const lastUsed = c.lastUsedAt ? new Date(c.lastUsedAt).toLocaleDateString('pt-BR') : '—';

    return `
      <div class="admin-client-row" data-access-code-id="${c.accessCodeId}">
        <div class="admin-client-row__main">
          <div class="admin-client-row__code">${c.maskedCode}</div>
          <div class="admin-client-row__meta">${c.name} · criado em ${created} · último acesso: ${lastUsed}</div>
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
        const accessCodeId = row.dataset.accessCodeId;
        const action = btn.dataset.adminAction;
        this._handleClientAction(accessCodeId, action);
      });
    });
  },

  async _handleClientAction(accessCodeId, action) {
    try {
      if (action === 'block' || action === 'reactivate') {
        await SupabaseClient.adminSetClientStatus(accessCodeId, action);
        Toast.show(action === 'block' ? 'Acesso bloqueado.' : 'Acesso reativado.', 'success');
        this._loadClients();
        return;
      }

      if (action === 'reset') {
        const confirmed = window.confirm('Tem certeza que deseja resetar todo o progresso deste cliente? Esta ação não pode ser desfeita.');
        if (!confirmed) return;

        await SupabaseClient.adminResetClient(accessCodeId);
        Toast.show('Progresso resetado.', 'success');
        this._loadClients();
        return;
      }

      if (action === 'delete') {
        const firstConfirm = window.confirm('Tem certeza que deseja excluir este cliente permanentemente? Todos os dados dele (nome, metas e check-ins) serão apagados.');
        if (!firstConfirm) return;

        const secondConfirm = window.confirm('Confirmação final: esta ação NÃO pode ser desfeita. Deseja realmente excluir este cliente?');
        if (!secondConfirm) return;

        await SupabaseClient.adminDeleteClient(accessCodeId);
        Toast.show('Cliente excluído permanentemente.', 'success');
        this._loadClients();
      }
    } catch (err) {
      Toast.show(err.message || 'Não foi possível concluir a ação.', 'error');
    }
  },
};
