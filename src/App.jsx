import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Command,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  LogOut,
  Radio,
  Settings2,
  ShieldCheck,
  Signal,
  WifiOff,
  X,
} from 'lucide-react';
import { Brand, UnitSchematic, SectionHeading, Field } from './components.jsx';
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
import Tablet from './Tablet.jsx';

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

function UtilityDialog({ page, onClose, children }) {
  const dialog = useRef();
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="utility-dialog"
      aria-label={page === 'admin' ? 'Painel de comando' : 'Configurações do terminal'}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="utility-topline">
        <span>
          {page === 'admin' ? <Command size={17} /> : <Settings2 size={17} />}
          {page === 'admin' ? 'PAINEL DE COMANDO' : 'CONFIGURAÇÕES DO TERMINAL'}
        </span>
        <button className="icon-button" aria-label="Voltar ao tablet" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="utility-content">{children}</div>
    </dialog>
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
  const { user, settings } = snapshot;
  const offline = status !== 'online';
  return (
    <div className="psci-app">
      <header className="device-header">
        <Brand />
        <span className="device-header-code">ARK NETWORK / PERSONAL FIELD TERMINAL</span>
        <div className={`connection-state ${offline ? 'disconnected' : ''}`}>
          {offline ? <WifiOff size={14} /> : <Signal size={15} />}
          <span>
            {status === 'connecting' ? 'CONECTANDO' : offline ? 'CONSULTA LOCAL' : 'VÍNCULO ATIVO'}
          </span>
        </div>
        <nav className="device-header-actions" aria-label="Acesso ao terminal">
          {user.role === 'admin' && (
            <button
              aria-label="Painel de comando"
              title="Painel de comando"
              onClick={() => setPage('admin')}
            >
              <Command size={18} />
            </button>
          )}
          <button
            aria-label="Configurações da conta"
            title="Configurações do terminal"
            onClick={() => setPage('system')}
          >
            <Settings2 size={18} />
          </button>
          <button aria-label="Desconectar" title="Desconectar" onClick={logout}>
            <LogOut size={17} />
          </button>
        </nav>
      </header>
      <main className="device-stage">
        {offline && (
          <div className="offline-banner" role="status">
            <WifiOff size={15} />
            <span>
              {status === 'connecting'
                ? 'Estabelecendo vínculo com a Arca...'
                : 'Sinal interrompido. Ficha disponível para consulta local. A reconexão é automática.'}
            </span>
          </div>
        )}
        <Tablet
          key={user.id}
          user={user}
          settings={settings}
          status={status}
          effects={effects}
          busy={busy}
          mutate={mutate}
          onOpenSettings={() => setPage('system')}
        />
      </main>
      {page !== 'overview' && (
        <UtilityDialog page={page} onClose={() => setPage('overview')}>
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
        </UtilityDialog>
      )}
      {toastNode}
    </div>
  );
}
