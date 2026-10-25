import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Command,
  Copy,
  Crosshair,
  Eye,
  EyeOff,
  Fingerprint,
  LogOut,
  Radio,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Terminal,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import {
  Brand,
  UnitSchematic,
  SectionHeading,
  AttributeCard,
  Vitals,
  Field,
  EmptyState,
} from './components.jsx';
import {
  cacheSnapshot,
  clearSession,
  readCache,
  readSession,
  request,
  saveSession,
  subscribe,
} from './api.js';
import Admin from './Admin.jsx';
import PhotoEditor from './PhotoEditor.jsx';

const NAVIGATION = [
  { id: 'overview', label: 'Minha ficha', mobile: 'Ficha', icon: Fingerprint },
  { id: 'attributes', label: 'Atributos', mobile: 'Atributos', icon: SlidersHorizontal },
  { id: 'journal', label: 'Diário de campo', mobile: 'Diário', icon: BookOpen },
  { id: 'system', label: 'Meu terminal', mobile: 'Terminal', icon: Settings2 },
];

function Login({ onLogin, notify }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function authenticate(event, credentials) {
    event?.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await request('/login', {
        method: 'POST',
        body: JSON.stringify(credentials || { username, password }),
      });
      saveSession({ token: data.token, id: data.snapshot.user.id }, remember);
      onLogin({ token: data.token, id: data.snapshot.user.id }, data.snapshot);
      notify('Vínculo estabelecido. Bem-vindo à rede PSCI.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <header className="login-header">
        <Brand />
        <span className="network-label">
          <span className="status-dot" /> ARK NETWORK <span className="muted">/</span> V.01
        </span>
      </header>
      <main className="login-layout">
        <section className="login-world">
          <div className="eyebrow orange">
            <span className="tiny-cross">+</span> TERMINAL PESSOAL DE EXPEDIÇÃO
          </div>
          <h1>
            SEU SINAL.
            <br />
            <span>ALÉM DA ARCA.</span>
          </h1>
          <p>
            A superfície é território hostil.
            <br />
            Sua identidade continua com você.
          </p>
          <div className="login-art">
            <UnitSchematic large />
            <div className="art-index">
              01
              <span>
                PERSONAL
                <br />
                LINK SYSTEM
              </span>
            </div>
            <span className="coordinate-label">ARK / SURFACE INTERFACE</span>
          </div>
          <div className="login-world-footer">
            <Radio size={17} />
            <span>IDENTIDADE. RECURSOS. SOBREVIVÊNCIA.</span>
            <span className="line" />
          </div>
        </section>
        <section className="login-panel">
          <div className="panel-topline">
            <span>IDENTIFICAÇÃO REQUERIDA</span>
            <span>SEC. 001</span>
          </div>
          <div className="login-panel-body">
            <span className="login-icon">
              <Fingerprint size={30} strokeWidth={1.3} />
            </span>
            <div className="eyebrow">ACESSO À REDE</div>
            <h2>
              Conecte sua unidade<span>.</span>
            </h2>
            <p>Insira suas credenciais para iniciar o vínculo.</p>
            <form onSubmit={authenticate}>
              <Field label="IDENTIFICAÇÃO / USUÁRIO">
                <input
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder="Seu identificador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field>
              <Field label="CHAVE DE ACESSO">
                <div className="password-field">
                  <input
                    name="password"
                    autoComplete="current-password"
                    type={visible ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Manter este terminal conectado</span>
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button primary login-submit" disabled={busy} type="submit">
                <span>{busy ? 'ESTABELECENDO VÍNCULO...' : 'INICIAR CONEXÃO'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
            <div className="demo-accounts">
              <span className="eyebrow">PRIMEIRO ACESSO / DEMONSTRAÇÃO</span>
              <div>
                <button
                  disabled={busy}
                  onClick={(e) => authenticate(e, { username: 'unidade01', password: 'psci123' })}
                >
                  <Fingerprint size={15} />
                  <span>
                    UNIDADE 01<small>unidade01 / psci123</small>
                  </span>
                  <ChevronRight size={14} />
                </button>
                <button
                  disabled={busy}
                  onClick={(e) => authenticate(e, { username: 'admin', password: 'admin123' })}
                >
                  <Command size={15} />
                  <span>
                    COMANDO<small>admin / admin123</small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
          <footer className="login-panel-footer">
            <ShieldCheck size={14} />
            <span>CADA UNIDADE, UMA IDENTIDADE.</span>
            <span className="mini-bars">▰▰▰▱</span>
          </footer>
        </section>
      </main>
      <footer className="login-footer">
        <span>PSCI SYSTEMS © 2026</span>
        <span>INTERFACE EXPERIMENTAL / RPG NIKKE</span>
        <span>PROTOCOL 00.1</span>
      </footer>
    </div>
  );
}

function Identity({ character, username }) {
  return (
    <section className="identity-card">
      <div className="identity-info">
        <div className="eyebrow">
          <span className="status-dot" /> IDENTIDADE OPERACIONAL{' '}
          <span className="identity-revision">REV. 01</span>
        </div>
        <h1 className="glitch-title" data-text={character.name || 'UNIDADE 01'}>
          {character.name || 'UNIDADE 01'}
        </h1>
        <p className="identity-subtitle">{character.designation || 'Unidade de expedição'}</p>
        <div className="identity-fields">
          <div>
            <span>MODELO</span>
            <strong>{character.model || 'Não definido'}</strong>
          </div>
          <div>
            <span>AFILIAÇÃO</span>
            <strong className="affiliation-mark">
              <i />
              {character.affiliation || 'Não definida'}
            </strong>
          </div>
          <div>
            <span>ESQUADRÃO</span>
            <strong>{character.squad || 'Não designado'}</strong>
          </div>
        </div>
        <div className="identity-bottom">
          <span className="serial-badge">{character.serial}</span>
          <span className="mono muted">@{username}</span>
          <div className="barcode" aria-hidden="true" />
        </div>
      </div>
      <div className="identity-visual">
        <span className="visual-label">
          UNIT SCAN <span>01 / NIKKE</span>
        </span>
        <span className="unit-watermark">N</span>
        <UnitSchematic />
        <div className="visual-bottom">
          <span>PERSONAL LINK</span>
          <Fingerprint size={16} />
          <span>REGISTERED</span>
        </div>
      </div>
    </section>
  );
}

function Journal({ character, onSave, busy, disabled, log }) {
  const [notes, setNotes] = useState(character.notes);
  const [equipment, setEquipment] = useState(character.equipment);
  const baseline = useRef({ notes: character.notes, equipment: character.equipment });
  const dirty = notes !== baseline.current.notes || equipment !== baseline.current.equipment;
  useEffect(() => {
    if (!dirty) {
      setNotes(character.notes);
      setEquipment(character.equipment);
      baseline.current = { notes: character.notes, equipment: character.equipment };
    }
  }, [character.notes, character.equipment, dirty]);
  async function save() {
    if (await onSave({ notes, equipment })) {
      baseline.current = { notes: notes.trim(), equipment: equipment.trim() };
      setNotes(notes.trim());
      setEquipment(equipment.trim());
    }
  }
  return (
    <div className="page-stack">
      <SectionHeading code="03" title="Diário de campo">
        <span className="pill">{dirty ? 'ALTERAÇÕES LOCAIS' : 'SINCRONIZADO'}</span>
      </SectionHeading>
      <div className="journal-grid">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <BookOpen size={18} />
            <h3>Registro de expedição</h3>
            <span className="mono muted">01</span>
          </div>
          <p className="panel-description">
            Observações, objetivos e tudo o que vale trazer de volta.
          </p>
          <label className="sr-only" htmlFor="field-notes">
            Anotações de campo
          </label>
          <textarea
            id="field-notes"
            maxLength={12000}
            placeholder="Inicie seu registro de campo..."
            value={notes}
            disabled={disabled}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="editor-bottom">
            <span>{notes.length} / 12000</span>
            <Radio size={14} />
          </div>
        </section>
        <section className="panel editor-panel">
          <div className="panel-heading">
            <Crosshair size={18} />
            <h3>Equipamento</h3>
            <span className="mono muted">02</span>
          </div>
          <p className="panel-description">Armamento, suprimentos e itens levados à superfície.</p>
          <label className="sr-only" htmlFor="field-equipment">
            Equipamento de campo
          </label>
          <textarea
            id="field-equipment"
            maxLength={12000}
            placeholder="Nenhum equipamento registrado..."
            value={equipment}
            disabled={disabled}
            onChange={(e) => setEquipment(e.target.value)}
          />
          <div className="editor-bottom">
            <span>{equipment.length} / 12000</span>
            <Crosshair size={14} />
          </div>
        </section>
      </div>
      <div className="form-actions">
        <span className="small-note">
          {disabled
            ? 'Consulta local. Reconecte-se para editar.'
            : 'Registros ficam disponíveis neste terminal e no comando.'}
        </span>
        <button className="button primary" disabled={disabled || busy || !dirty} onClick={save}>
          <Save size={16} />
          {busy ? 'SALVANDO...' : 'SALVAR REGISTROS'}
        </button>
      </div>
      <ActivityLog log={log} />
    </div>
  );
}

function ActivityLog({ log, limit = 6 }) {
  return (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <Terminal size={17} />
        <h3>Registro do sistema</h3>
        <span className="pill">LOG</span>
      </div>
      <div className="activity-list">
        {log.slice(0, limit).map((entry) => (
          <div className="activity-entry" key={entry.id}>
            <span className="log-dot" />
            <time dateTime={entry.time}>
              {new Date(entry.time).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
            <p>{entry.message}</p>
            <span className="log-actor">{entry.actor}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TerminalSettings({ effects, setEffects, snapshot, status, notify, logout, mutate, busy }) {
  async function copyId() {
    try {
      await navigator.clipboard.writeText(snapshot.user.character.serial);
      notify('Identificador copiado.');
    } catch {
      notify('A cópia não está disponível neste navegador.', 'error');
    }
  }
  return (
    <div className="page-stack">
      <SectionHeading code="04" title="Meu terminal">
        <span className="pill">IDENTIDADE E INTERFACE</span>
      </SectionHeading>
      <section className="panel settings-panel">
        <PhotoEditor
          value={snapshot.user.character.photo}
          onChange={(photo) => mutate('/me', { photo }, 'Foto de identificação sincronizada.')}
          disabled={busy || status !== 'online'}
          notify={notify}
        />
      </section>
      <section className="panel settings-panel">
        <div className="panel-heading">
          <Settings2 size={18} />
          <h3>Interface do PSCI</h3>
        </div>
        <div className="settings-row">
          <div>
            <strong>Efeitos de transmissão</strong>
            <p>Scanlines, varredura e interferências visuais discretas.</p>
          </div>
          <button
            className={`toggle ${effects ? 'active' : ''}`}
            role="switch"
            aria-checked={effects}
            aria-label="Efeitos de transmissão"
            onClick={() => setEffects(!effects)}
          >
            <span />
          </button>
        </div>
        <div className="settings-row">
          <div>
            <strong>Identificador do terminal</strong>
            <p className="mono">{snapshot.user.character.serial}</p>
          </div>
          <button className="button secondary small" onClick={copyId}>
            <Copy size={14} />
            COPIAR
          </button>
        </div>
        <div className="settings-row">
          <div>
            <strong>Vínculo com a rede</strong>
            <p>
              {status === 'online'
                ? 'Atualizações recebidas em tempo real.'
                : 'Exibindo a última cópia salva neste navegador.'}
            </p>
          </div>
          <span className={`pill ${status === 'online' ? 'success' : 'warning'}`}>
            {status === 'online' ? 'CONECTADO' : 'CONSULTA LOCAL'}
          </span>
        </div>
        <div className="settings-row">
          <div>
            <strong>Sessão atual</strong>
            <p>
              @{snapshot.user.username} · {snapshot.user.role === 'admin' ? 'Comando' : 'Operador'}{' '}
              · permanência de até 30 dias
            </p>
          </div>
          <button className="button secondary small" onClick={logout}>
            <LogOut size={14} />
            DESCONECTAR
          </button>
        </div>
      </section>
      <section className="notice-panel">
        <CircleHelp size={20} />
        <div>
          <h3>Primeira versão / regras em desenvolvimento</h3>
          <p>
            As perícias exibem os valores cadastrados, sem somar o atributo base. Campos “—” ainda
            não foram definidos. Intuição começa com +2, incluindo o bônus Micilis informado. HP =
            20 + (5 × Resistência), energia máxima = 5 e AC = 10 + Agilidade. Enquanto Resistência
            estiver vazia, a prévia de HP considera 0.
          </p>
          <p>
            Ajustar HP e energia registra os recursos atuais; não aplica regras de dano, descanso ou
            progressão. As preferências visuais ficam apenas neste navegador.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [snapshot, setSnapshot] = useState(() => {
    const current = readSession();
    return current ? readCache(current.id) : null;
  });
  const [status, setStatus] = useState('connecting');
  const [page, setPage] = useState('overview');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [effects, changeEffects] = useState(() => {
    try {
      const saved = localStorage.getItem('psci-effects');
      return saved !== null
        ? saved === 'true'
        : !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });
  const toastTimer = useRef();
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  const applySnapshot = useCallback((data) => {
    setSnapshot(data);
    cacheSnapshot(data);
  }, []);
  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setSnapshot(null);
    setStatus('connecting');
    setPage('overview');
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    document.documentElement.dataset.effects = effects ? 'on' : 'off';
    try {
      localStorage.setItem('psci-effects', String(effects));
    } catch {
      /* Keep the preference for this visit. */
    }
  }, [effects]);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const revoked = () => {
      logout();
      notify('Sessão encerrada. Identifique-se novamente.', 'error');
    };
    request('/session', { token: session.token, signal: controller.signal })
      .then(applySnapshot)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          if (error.status === 401) revoked();
          else setStatus('offline');
        }
      });
    const unsubscribe = subscribe(session.token, {
      onSnapshot: applySnapshot,
      onStatus: setStatus,
      onRevoked: revoked,
    });
    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [session, applySnapshot, logout, notify]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);
  async function mutate(path, body, successMessage = 'Dados sincronizados com a rede.') {
    if (busy) return false;
    setBusy(true);
    try {
      const data = await request(path, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      applySnapshot(data);
      if (successMessage) notify(successMessage);
      return data;
    } catch (error) {
      notify(error.message, 'error');
      if (error.status === 401) logout();
      return false;
    } finally {
      setBusy(false);
    }
  }
  const toastNode = toast && (
    <div className={`toast ${toast.type}`} role="status">
      {toast.type === 'error' ? <WifiOff size={17} /> : <Check size={17} />}
      <span>{toast.message}</span>
      <button aria-label="Fechar notificação" onClick={() => setToast(null)}>
        <X size={15} />
      </button>
    </div>
  );
  if (!session)
    return (
      <>
        <Login
          notify={notify}
          onLogin={(auth, data) => {
            setSession(auth);
            applySnapshot(data);
          }}
        />
        {toastNode}
      </>
    );
  if (!snapshot)
    return (
      <div className="boot-screen">
        <Brand />
        <Radio className="boot-radio" size={32} />
        <h1>{status === 'offline' ? 'SINAL NÃO ENCONTRADO' : 'ESTABELECENDO VÍNCULO'}</h1>
        <p>
          {status === 'offline'
            ? 'Não há uma cópia local desta ficha. Reconecte o servidor para continuar.'
            : 'Autenticando identidade na rede da Arca...'}
        </p>
        {status === 'offline' && (
          <button className="button secondary" onClick={logout}>
            VOLTAR AO ACESSO
          </button>
        )}
      </div>
    );
  const { user, settings, log } = snapshot;
  const { character } = user;
  const nav = [
    ...NAVIGATION,
    ...(user.role === 'admin'
      ? [{ id: 'admin', label: 'Painel de comando', mobile: 'Comando', icon: Command }]
      : []),
  ];
  const currentNav = nav.find((item) => item.id === page) || nav[0];
  const filteredGroups = settings.schema
    .map((group) => ({
      ...group,
      skills: group.label.toLowerCase().includes(query.toLowerCase())
        ? group.skills
        : group.skills.filter((skill) => skill.label.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter(
      (group) => group.skills.length || group.label.toLowerCase().includes(query.toLowerCase()),
    );
  const offline = status !== 'online';
  return (
    <div className="app-shell">
      <aside className="side-rail">
        <button
          className="rail-brand"
          aria-label="Abrir minha ficha"
          onClick={() => setPage('overview')}
        >
          <Brand compact />
        </button>
        <div className="rail-divider" />
        <nav aria-label="Navegação principal">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`rail-item ${page === id ? 'active' : ''}`}
              title={label}
              aria-label={label}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => setPage(id)}
            >
              <Icon size={21} strokeWidth={1.5} />
              <span className="rail-tooltip">{label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <span className="vertical-label">PERSONAL LINK / V.01</span>
          <button
            className="rail-item"
            title="Desconectar"
            aria-label="Desconectar"
            onClick={logout}
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <Brand />
          <div className="header-divider" />
          <span className="header-context">
            TERMINAL DE EXPEDIÇÃO <span>/</span> {character.serial}
          </span>
          <div className={`connection-state ${offline ? 'disconnected' : ''}`}>
            {offline ? <WifiOff size={14} /> : <Signal size={15} />}
            <span>
              {status === 'connecting'
                ? 'CONECTANDO'
                : offline
                  ? 'CONSULTA LOCAL'
                  : 'VÍNCULO ATIVO'}
            </span>
          </div>
          <button
            className="account-button"
            aria-label="Configurações da conta"
            onClick={() => setPage('system')}
          >
            <span className="profile-photo header-photo">
              {character.photo ? (
                <img
                  src={character.photo}
                  alt={`Foto de perfil de ${character.name || user.username}`}
                />
              ) : (
                <Fingerprint size={23} strokeWidth={1.2} />
              )}
            </span>
            <ChevronRight size={13} />
          </button>
        </header>
        <main className="main-content">
          <div className="page-topline">
            <div className="breadcrumb">
              ARCA <ChevronRight size={10} /> REDE PSCI <ChevronRight size={10} />
              <span>{currentNav.label}</span>
            </div>
            <span className="session-code">SESSION / {user.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="page-title-row">
            <div>
              <div className="eyebrow orange">PERSONAL SISTEM CARD ID</div>
              <h1>
                {page === 'overview' ? 'Visão geral' : currentNav.label}
                <span className="title-square" />
              </h1>
            </div>
            <span className="access-badge">
              <ShieldCheck size={15} />
              {user.role === 'admin' ? 'ACESSO DE COMANDO' : 'ACESSO DE OPERADOR'}
            </span>
          </div>
          {offline && (
            <div className="offline-banner" role="status">
              <WifiOff size={16} />
              <span>
                {status === 'connecting'
                  ? 'Estabelecendo conexão com o servidor...'
                  : 'Sinal interrompido. Sua última ficha está disponível para consulta. A reconexão é automática.'}
              </span>
            </div>
          )}
          {page === 'overview' && (
            <div className="page-stack">
              <Identity character={character} username={user.username} />
              <div className="operation-strip">
                <Radio size={15} />
                <span>{settings.operation || 'OPERAÇÃO NÃO DESIGNADA'}</span>
                <i />
                <span className="operation-sector">{settings.sector}</span>
                <ArrowUpRight size={15} />
              </div>
              <div>
                <SectionHeading code="01" title="Condição de campo">
                  <span className="eyebrow muted">RECURSOS ATUAIS</span>
                </SectionHeading>
                <Vitals
                  character={character}
                  disabled={offline || busy}
                  onChange={(id, value) => mutate('/me', { vitals: { [id]: value } }, '')}
                />
              </div>
              <div>
                <SectionHeading code="02" title="Matriz de atributos">
                  <button className="text-button" onClick={() => setPage('attributes')}>
                    EXPLORAR ATRIBUTOS <ArrowUpRight size={14} />
                  </button>
                </SectionHeading>
                <div className="attributes-grid">
                  {settings.schema.map((group, index) => (
                    <AttributeCard
                      group={group}
                      character={character}
                      index={index}
                      key={group.id}
                    />
                  ))}
                </div>
                <p className="matrix-footnote">
                  <span>—</span> Valor não definido <i /> Valores individuais, sem soma automática
                  com o atributo base.
                </p>
              </div>
              <div className="broadcast-strip">
                <span className="broadcast-icon">
                  <Radio size={21} />
                </span>
                <div>
                  <span className="eyebrow orange">TRANSMISSÃO DO COMANDO</span>
                  <p>{settings.broadcast || 'Nenhum comunicado ativo.'}</p>
                </div>
                <span className="transmission-bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          )}
          {page === 'attributes' && (
            <div className="page-stack">
              <section className="attribute-intro">
                <div>
                  <span className="eyebrow orange">LEITURA DE CAPACIDADES</span>
                  <h2>Conheça seus parâmetros.</h2>
                  <p>Seis atributos. Uma identidade. Consulte as capacidades da sua unidade.</p>
                </div>
                <label className="search-field">
                  <Search size={17} />
                  <input
                    aria-label="Buscar atributo ou perícia"
                    placeholder="Buscar atributo ou perícia"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      className="icon-button"
                      aria-label="Limpar busca"
                      onClick={() => setQuery('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
              </section>
              <div className="attributes-grid detailed">
                {filteredGroups.map((group) => (
                  <AttributeCard
                    group={group}
                    character={character}
                    index={settings.schema.findIndex((g) => g.id === group.id)}
                    key={group.id}
                  />
                ))}
              </div>
              {!filteredGroups.length && (
                <EmptyState title="Nenhum parâmetro encontrado">
                  Tente outro nome de atributo ou perícia.
                </EmptyState>
              )}
              <section className="notice-panel">
                <CircleHelp size={18} />
                <div>
                  <h3>Parâmetros definidos pelo comando</h3>
                  <p>
                    Os valores são os da sua ficha. Regras de testes e progressão ainda não estão
                    configuradas.{' '}
                    {character.intuitionNote && `Intuição: ${character.intuitionNote}.`}
                  </p>
                </div>
              </section>
            </div>
          )}
          {page === 'journal' && (
            <Journal
              key={user.id}
              character={character}
              onSave={(values) => mutate('/me', values, 'Registros de campo sincronizados.')}
              busy={busy}
              disabled={offline}
              log={log}
            />
          )}
          {page === 'system' && (
            <TerminalSettings
              effects={effects}
              setEffects={changeEffects}
              snapshot={snapshot}
              status={status}
              notify={notify}
              logout={logout}
              mutate={mutate}
              busy={busy}
            />
          )}
          {page === 'admin' && user.role === 'admin' && (
            <Admin
              snapshot={snapshot}
              token={session.token}
              mutate={mutate}
              applySnapshot={applySnapshot}
              notify={notify}
              busy={busy}
              offline={offline}
            />
          )}
        </main>
        <footer className="app-footer">
          <span>
            <span className={`status-dot ${offline ? 'warning' : ''}`} />
            {offline ? 'CÓPIA LOCAL' : 'CANAL SINCRONIZADO'}
          </span>
          <span>
            PSCI SYSTEMS <i /> RPG NIKKE / INTERFACE EXPERIMENTAL
          </span>
          <span>
            BUILD 00.1 <span className="orange">+</span>
          </span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Navegação mobile">
        {nav.map(({ id, mobile, icon: Icon }) => (
          <button
            key={id}
            className={page === id ? 'active' : ''}
            aria-current={page === id ? 'page' : undefined}
            onClick={() => setPage(id)}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span>{mobile}</span>
          </button>
        ))}
      </nav>
      {toastNode}
    </div>
  );
}
