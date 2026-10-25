import { useEffect, useRef, useState } from 'react';
import {
  Command,
  Eye,
  EyeOff,
  Plus,
  Radio,
  Save,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { EmptyState, Field, SectionHeading, attributeIcons } from './components.jsx';
import { getVitals } from '../shared/schema.js';
import { request } from './api.js';
import PhotoEditor from './PhotoEditor.jsx';

function changedFields(original, next) {
  const result = {};
  for (const key of [
    'name',
    'model',
    'affiliation',
    'squad',
    'designation',
    'intuitionNote',
    'notes',
    'equipment',
    'photo',
  ])
    if (original[key] !== next[key]) result[key] = next[key];
  for (const key of ['attributes', 'skills', 'vitals']) {
    const changes = Object.fromEntries(
      Object.entries(next[key]).filter(([id, value]) => original[key][id] !== value),
    );
    if (Object.keys(changes).length) result[key] = changes;
  }
  return result;
}

function NewAccount({ token, onClose, onCreate, notify }) {
  const dialog = useRef();
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'player' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    dialog.current.showModal();
    dialog.current.querySelector('input')?.focus();
  }, []);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await request('/admin/accounts', {
        token,
        method: 'POST',
        body: JSON.stringify(form),
      });
      onCreate(data);
      notify('Conta provisionada. A nova unidade já pode se conectar.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  function update(key, value) {
    setForm({ ...form, [key]: value });
  }
  return (
    <dialog
      ref={dialog}
      className="modal"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !busy) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="panel-heading">
          <Command size={18} />
          <span className="eyebrow orange">PROVISIONAMENTO</span>
          <button
            className="icon-button"
            aria-label="Fechar criação de conta"
            disabled={busy}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        <h2>
          Uma nova identidade<span>.</span>
        </h2>
        <p className="panel-description">A conta recebe a ficha base da primeira versão.</p>
        <form onSubmit={submit}>
          <Field label="USUÁRIO" hint="3 a 32 caracteres. Sem espaços ou acentos.">
            <input
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
              value={form.username}
              onChange={(e) => update('username', e.target.value.toLowerCase())}
              required
              pattern="[a-z0-9_.\-]{3,32}"
              maxLength={32}
              placeholder="Ex.: unidade02"
            />
          </Field>
          <Field label="SENHA INICIAL" hint="Mínimo de 4 caracteres.">
            <div className="password-field">
              <input
                autoComplete="new-password"
                type={visible ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={4}
                maxLength={200}
                placeholder="Defina a chave de acesso"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="NOME DA UNIDADE / OPCIONAL">
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              maxLength={150}
              placeholder="Nome da personagem"
            />
          </Field>
          <Field label="PERMISSÃO">
            <select value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="player">Operador / jogador</option>
              <option value="admin">Comando / administrador</option>
            </select>
          </Field>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
              CANCELAR
            </button>
            <button type="submit" className="button primary" disabled={busy}>
              <Plus size={16} />
              {busy ? 'CRIANDO...' : 'CRIAR CONTA'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function AccountEditor({ account, schema, mutate, busy, disabled, selfId, notify }) {
  const [draft, setDraft] = useState(() => structuredClone(account.character));
  const baseline = useRef(structuredClone(account.character));
  const [password, setPassword] = useState('');
  const changes = changedFields(baseline.current, draft);
  const dirty = Object.keys(changes).length > 0 || password.length > 0;
  useEffect(() => {
    if (!dirty) {
      baseline.current = structuredClone(account.character);
      setDraft(structuredClone(account.character));
    }
  }, [account.character, dirty]);
  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function number(key, id, value) {
    setDraft((current) => ({
      ...current,
      [key]: { ...current[key], [id]: value === '' ? null : Number(value) },
    }));
  }
  async function save(event) {
    event.preventDefault();
    const data = await mutate(
      `/admin/accounts/${account.id}`,
      {
        ...(Object.keys(changes).length ? { character: changes } : {}),
        ...(password ? { password } : {}),
      },
      `Ficha de ${account.username} sincronizada.`,
    );
    if (data) {
      const updated = data.accounts.find((item) => item.id === account.id);
      baseline.current = structuredClone(updated.character);
      setDraft(structuredClone(updated.character));
      setPassword('');
    }
  }
  const { maxHp, maxEnergy, ac } = getVitals(draft);
  return (
    <form className="account-editor" onSubmit={save}>
      <div className="editor-account-title">
        <div>
          <span className="eyebrow orange">{account.character.serial}</span>
          <h2>{account.character.name || account.username}</h2>
        </div>
        <span className="pill">{account.role === 'admin' ? 'COMANDO' : 'OPERADOR'}</span>
      </div>
      <fieldset disabled={disabled || busy}>
        <section className="panel form-panel">
          <div className="panel-heading">
            <ShieldCheck size={17} />
            <h3>Identidade da unidade</h3>
          </div>
          <div className="form-grid">
            <Field label="NOME">
              <input
                value={draft.name}
                maxLength={150}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Não definido"
              />
            </Field>
            <Field label="MODELO">
              <input
                value={draft.model}
                maxLength={150}
                onChange={(e) => update('model', e.target.value)}
                placeholder="Não definido"
              />
            </Field>
            <Field label="AFILIAÇÃO">
              <input
                value={draft.affiliation}
                maxLength={150}
                onChange={(e) => update('affiliation', e.target.value)}
                list="affiliations"
              />
              <datalist id="affiliations">
                <option value="Micilis" />
                <option value="Elysion" />
                <option value="Tetra" />
                <option value="Pilgrim" />
              </datalist>
            </Field>
            <Field label="ESQUADRÃO">
              <input
                value={draft.squad}
                maxLength={150}
                onChange={(e) => update('squad', e.target.value)}
                placeholder="Não designado"
              />
            </Field>
            <Field label="FUNÇÃO / DESIGNAÇÃO">
              <input
                value={draft.designation}
                maxLength={150}
                onChange={(e) => update('designation', e.target.value)}
              />
            </Field>
            <Field label="NOTA DO BÔNUS DE INTUIÇÃO">
              <input
                value={draft.intuitionNote}
                maxLength={150}
                onChange={(e) => update('intuitionNote', e.target.value)}
              />
            </Field>
          </div>
        </section>
        <section className="panel form-panel">
          <PhotoEditor
            value={draft.photo}
            onChange={(photo) => update('photo', photo)}
            disabled={disabled || busy}
            notify={notify}
          />
        </section>
        <div className="admin-vitals">
          <Field label={`HP ATUAL / MÁX. ${maxHp}`}>
            <input
              type="number"
              min={0}
              max={Math.max(0, maxHp)}
              step={1}
              value={draft.vitals.hp}
              onChange={(e) => number('vitals', 'hp', e.target.value)}
              required
            />
          </Field>
          <Field label={`ENERGIA / MÁX. ${maxEnergy}`}>
            <input
              type="number"
              min={0}
              max={maxEnergy}
              step={1}
              value={draft.vitals.energy}
              onChange={(e) => number('vitals', 'energy', e.target.value)}
              required
            />
          </Field>
          <div className="calculated-field">
            <span>AC / CALCULADA</span>
            <strong>{ac}</strong>
          </div>
        </div>
        <div className="admin-attributes">
          {schema.map((group) => {
            const Icon = attributeIcons[group.id];
            return (
              <section className="panel admin-attribute" key={group.id}>
                <header>
                  <Icon size={17} />
                  <h3>{group.label}</h3>
                  <label className="base-input">
                    <span>BASE</span>
                    <input
                      type="number"
                      step={1}
                      min={-999}
                      max={999}
                      aria-label={`Base de ${group.label}`}
                      value={draft.attributes[group.id] ?? ''}
                      onChange={(e) => number('attributes', group.id, e.target.value)}
                    />
                  </label>
                </header>
                <div>
                  {group.skills.map((skill) => (
                    <label className="admin-skill" key={skill.id}>
                      <span>{skill.label}</span>
                      <input
                        type="number"
                        step={1}
                        min={-999}
                        max={999}
                        aria-label={`${group.label}: ${skill.label}`}
                        placeholder="—"
                        value={draft.skills[skill.id] ?? ''}
                        onChange={(e) => number('skills', skill.id, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <details className="panel credentials-panel">
          <summary>
            REDEFINIR CREDENCIAIS <span>+</span>
          </summary>
          <Field
            label="NOVA SENHA"
            hint={
              account.id === selfId
                ? 'Outra conta de comando pode redefinir a senha desta conta.'
                : 'Deixe em branco para manter a senha. A redefinição encerra as sessões anteriores.'
            }
          >
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Nova chave de acesso"
              value={password}
              minLength={4}
              maxLength={200}
              disabled={account.id === selfId}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </details>
        <div className="sticky-save">
          <span>
            <span className={`status-dot ${dirty ? 'warning' : ''}`} />
            {dirty ? 'ALTERAÇÕES NÃO SALVAS' : 'FICHA SINCRONIZADA'}
          </span>
          <button className="button primary" type="submit" disabled={!dirty || busy || disabled}>
            <Save size={16} />
            {busy ? 'SINCRONIZANDO...' : 'SALVAR FICHA'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function NetworkSettings({ settings, mutate, busy, offline }) {
  const [draft, setDraft] = useState(() => structuredClone(settings));
  const baseline = useRef(JSON.stringify(settings));
  const dirty = JSON.stringify(draft) !== baseline.current;
  useEffect(() => {
    if (!dirty) {
      setDraft(structuredClone(settings));
      baseline.current = JSON.stringify(settings);
    }
  }, [settings, dirty]);
  function updateLabel(groupIndex, skillIndex, value) {
    setDraft((current) => {
      const next = structuredClone(current);
      if (skillIndex == null) next.schema[groupIndex].label = value;
      else next.schema[groupIndex].skills[skillIndex].label = value;
      return next;
    });
  }
  async function submit(event) {
    event.preventDefault();
    const result = await mutate(
      '/admin/settings',
      draft,
      'Diretrizes transmitidas a todos os terminais.',
    );
    if (result) {
      baseline.current = JSON.stringify(result.settings);
      setDraft(structuredClone(result.settings));
    }
  }
  return (
    <form className="page-stack" onSubmit={submit}>
      <div className="notice-panel">
        <Radio size={20} />
        <div>
          <h3>Uma transmissão para toda a rede</h3>
          <p>
            Operação, comunicado e nomes dos atributos são compartilhados. Os valores individuais de
            cada jogador são preservados.
          </p>
        </div>
      </div>
      <fieldset disabled={busy || offline}>
        <section className="panel form-panel">
          <div className="panel-heading">
            <Radio size={18} />
            <h3>Diretrizes da expedição</h3>
          </div>
          <div className="form-grid">
            <Field label="OPERAÇÃO">
              <input
                maxLength={150}
                value={draft.operation}
                onChange={(e) => setDraft({ ...draft, operation: e.target.value })}
              />
            </Field>
            <Field label="SETOR / LOCALIZAÇÃO">
              <input
                maxLength={150}
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
              />
            </Field>
            <Field className="full-width" label="COMUNICADO DO COMANDO">
              <textarea
                rows={3}
                maxLength={500}
                value={draft.broadcast}
                onChange={(e) => setDraft({ ...draft, broadcast: e.target.value })}
              />
            </Field>
          </div>
        </section>
        <SectionHeading code="CFG" title="Estrutura dos atributos">
          <span className="eyebrow muted">COMPARTILHADA</span>
        </SectionHeading>
        <div className="schema-grid">
          {draft.schema.map((group, groupIndex) => (
            <section className="panel schema-card" key={group.id}>
              <Field label={`ATRIBUTO / ${group.code}`}>
                <input
                  required
                  maxLength={40}
                  value={group.label}
                  onChange={(e) => updateLabel(groupIndex, null, e.target.value)}
                />
              </Field>
              <div className="schema-skills">
                {group.skills.map((skill, index) => (
                  <label key={skill.id}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <input
                      required
                      maxLength={40}
                      value={skill.label}
                      aria-label={`Nome da perícia ${index + 1} de ${group.label}`}
                      onChange={(e) => updateLabel(groupIndex, index, e.target.value)}
                    />
                  </label>
                ))}
              </div>
              <button
                className="text-button"
                type="button"
                disabled={group.skills.length >= 20}
                onClick={() =>
                  setDraft((current) => {
                    const next = structuredClone(current);
                    next.schema[groupIndex].skills.push({
                      id: `custom_${crypto.randomUUID().replaceAll('-', '')}`,
                      label: 'Nova perícia',
                    });
                    return next;
                  })
                }
              >
                <Plus size={14} />
                ADICIONAR PERÍCIA
              </button>
            </section>
          ))}
        </div>
        <div className="sticky-save">
          <span>
            <span className={`status-dot ${dirty ? 'warning' : ''}`} />
            {dirty ? 'ALTERAÇÕES NÃO TRANSMITIDAS' : 'REDE ATUALIZADA'}
          </span>
          <button className="button primary" type="submit" disabled={!dirty || busy || offline}>
            <Radio size={16} />
            {busy ? 'TRANSMITINDO...' : 'TRANSMITIR ALTERAÇÕES'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

export default function Admin({ snapshot, token, mutate, applySnapshot, notify, busy, offline }) {
  const [tab, setTab] = useState('accounts');
  const [selectedId, setSelectedId] = useState(
    () => snapshot.accounts?.find((account) => account.role === 'player')?.id || snapshot.user.id,
  );
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const accounts = snapshot.accounts || [];
  const selected = accounts.find((account) => account.id === selectedId);
  const filtered = accounts.filter((account) =>
    `${account.username} ${account.character.name} ${account.character.serial}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (!snapshot.accounts)
    return (
      <EmptyState title="Comando indisponível nesta cópia">
        Reconecte o terminal para carregar o diretório de contas.
      </EmptyState>
    );
  return (
    <div className="page-stack">
      <div className="admin-summary">
        <div>
          <Command size={25} strokeWidth={1.2} />
          <div>
            <span className="eyebrow orange">CENTRAL DE OPERAÇÕES</span>
            <h2>O controle da sua expedição.</h2>
          </div>
        </div>
        <div className="account-count">
          <strong>{String(accounts.length).padStart(2, '0')}</strong>
          <span>
            TERMINAIS
            <br />
            REGISTRADOS
          </span>
        </div>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Seções do comando">
        <button role="tab" aria-selected={tab === 'accounts'} onClick={() => setTab('accounts')}>
          <Users size={15} />
          CONTAS E FICHAS
        </button>
        <button role="tab" aria-selected={tab === 'settings'} onClick={() => setTab('settings')}>
          <Radio size={15} />
          DIRETRIZES DA REDE
        </button>
        {tab === 'accounts' && (
          <button
            className="button primary small new-account-button"
            disabled={offline}
            onClick={() => setCreating(true)}
          >
            <Plus size={15} />
            NOVA CONTA
          </button>
        )}
      </div>
      {tab === 'accounts' && (
        <div className="admin-layout">
          <aside className="panel account-directory">
            <div className="directory-heading">
              <span className="eyebrow">DIRETÓRIO DE UNIDADES</span>
              <span>{String(accounts.length).padStart(2, '0')}</span>
            </div>
            <label className="search-field">
              <Search size={15} />
              <input
                aria-label="Buscar conta"
                placeholder="Localizar unidade"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="account-list">
              {filtered.map((account) => (
                <button
                  key={account.id}
                  className={`account-list-item ${selectedId === account.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(account.id)}
                >
                  <span className="avatar">
                    {account.character.photo ? (
                      <img src={account.character.photo} alt="" />
                    ) : account.role === 'admin' ? (
                      <Command size={17} />
                    ) : (
                      account.username.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span>
                    <strong>{account.character.name || account.username}</strong>
                    <small>
                      {account.character.serial} / {account.role === 'admin' ? 'CMD' : 'OPR'}
                    </small>
                  </span>
                  <span className="status-dot" />
                </button>
              ))}
            </div>
            {!filtered.length && (
              <p className="small-note directory-empty">Nenhuma unidade encontrada.</p>
            )}
            <footer>
              <ShieldCheck size={14} />
              EDIÇÃO RESTRITA AO COMANDO
            </footer>
          </aside>
          {selected ? (
            <AccountEditor
              key={selected.id}
              account={selected}
              schema={snapshot.settings.schema}
              mutate={mutate}
              busy={busy}
              disabled={offline}
              selfId={snapshot.user.id}
              notify={notify}
            />
          ) : (
            <EmptyState title="Selecione uma unidade">
              Escolha uma conta para consultar e editar a ficha.
            </EmptyState>
          )}
        </div>
      )}
      {tab === 'settings' && (
        <NetworkSettings
          settings={snapshot.settings}
          mutate={mutate}
          busy={busy}
          offline={offline}
        />
      )}
      {creating && (
        <NewAccount
          token={token}
          onClose={() => setCreating(false)}
          notify={notify}
          onCreate={(data) => {
            applySnapshot(data);
            setSelectedId(data.createdId);
          }}
        />
      )}
    </div>
  );
}
