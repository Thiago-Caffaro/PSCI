import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Fingerprint,
  Minus,
  Plus,
  Radio,
  Save,
  ScanFace,
  X,
} from 'lucide-react';
import { AttributeCard } from './components.jsx';
import { formatModifier, getVitals } from '../shared/schema.js';

// Provisional, code-native housing. The back is the same silhouette mirrored
// vertically, so the portrait module becomes the lower-left neural module.
const HOUSING = 'M32 9H220L242 30V142L264 164H520L551 194V785L526 811H32L9 788V33Z';
const scratches = [
  'M22 62l8-19m-8 91 5-19M82 19l21 3 14-3M174 20l31 3M227 56l-3 15',
  'M22 354l9-18m-8 74 4-22M22 595l7 13-6 21M23 732l6-18',
  'M539 251l-5 15 3 10m-1 52 5-21M538 508l-7 14 5 12M540 698l-5 24',
  'M53 798l25-3 10 3M142 798l17-4m55 5 22-3M395 798l24-2m42 3 35-4',
  'M280 176l21 3 17-3M433 176l19 4 27-2M531 195l8 14M39 23l17 3',
];

function Housing({ back = false }) {
  const id = useId();
  return (
    <svg
      className="tablet-housing"
      viewBox="0 0 560 820"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={id}>
          <path d={HOUSING} />
        </clipPath>
      </defs>
      <g transform={back ? 'translate(0 820) scale(1 -1)' : undefined}>
        <path d={HOUSING} fill="#434648" stroke="#111516" strokeWidth="17" strokeLinejoin="bevel" />
        <path d={HOUSING} fill="none" stroke="#727779" strokeWidth="2" />
        <path
          d="M33 24H212L228 40V157L258 181H510L533 204V778L517 795H42L25 778V42Z"
          fill="none"
          stroke="#282d2f"
          strokeWidth="3"
        />
        <g clipPath={`url(#${id})`} stroke="#a3a8a7" strokeWidth="1" opacity=".36">
          {scratches.map((d, i) => (
            <path d={d} key={i} />
          ))}
        </g>
        <g fill="#24292a" stroke="#747a79" strokeWidth="1.5">
          {[
            [34, 42],
            [214, 42],
            [34, 779],
            [524, 777],
            [527, 207],
            [275, 184],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="5" />
              <path d={`M${x - 2.5} ${y}h5`} />
            </g>
          ))}
        </g>
        <path d="M18 316v91M18 449v47M542 579v109" stroke="#282d2f" strokeWidth="5" />
        <path d="M259 173h111" stroke="#c7bca4" strokeWidth="2" opacity=".35" />
      </g>
    </svg>
  );
}

function PortraitPlaceholder() {
  return (
    <svg viewBox="0 0 240 300" className="portrait-placeholder" aria-hidden="true">
      <path
        d="M0 60h240M0 120h240M0 180h240M0 240h240M60 0v300M120 0v300M180 0v300"
        stroke="currentColor"
        opacity=".1"
      />
      <circle cx="120" cy="115" r="75" stroke="currentColor" fill="none" opacity=".28" />
      <path
        d="M78 99c0-31 18-46 42-46s42 15 42 46v31c0 27-19 48-42 48s-42-21-42-48zm-30 178v-30c0-26 23-48 52-48h40c29 0 52 22 52 48v30"
        fill="currentColor"
        fillOpacity=".06"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M78 110h84M105 151h30M101 179v17l19 13 19-13v-17M21 20h24M21 20v24M219 20h-24M219 20v24M21 280h24M21 280v-24M219 280h-24M219 280v-24"
        stroke="currentColor"
        opacity=".65"
      />
      <text
        x="120"
        y="257"
        fill="currentColor"
        fontSize="9"
        textAnchor="middle"
        fontFamily="monospace"
        letterSpacing="2"
      >
        RETRATO PENDENTE
      </text>
    </svg>
  );
}

const neuralPoints = Array.from({ length: 150 }, (_, i) => {
  const angle = i * 2.399963;
  const radius = Math.sqrt((i + 0.5) / 150);
  return [120 + Math.cos(angle) * radius * 82, 145 + Math.sin(angle) * radius * 105];
});
const neuralLinks = neuralPoints.flatMap((point, index) =>
  neuralPoints
    .slice(index + 1)
    .map((other, j) => ({
      point,
      other,
      key: `${index}-${j}`,
      distance: Math.hypot(point[0] - other[0], point[1] - other[1]),
    }))
    .filter(({ distance }) => distance < 24),
);

function NeuralPlaceholder() {
  return (
    <svg
      viewBox="0 0 240 300"
      className="neural-placeholder"
      role="img"
      aria-label="Visualização provisória do cérebro e da rede NIMPH"
    >
      <path
        d="M14 54h212M14 145h212M14 242h212M50 12v276M120 12v276M190 12v276"
        stroke="currentColor"
        opacity=".08"
      />
      <g fill="none" stroke="currentColor" opacity=".22">
        <ellipse cx="120" cy="145" rx="94" ry="121" />
        <ellipse cx="120" cy="145" rx="108" ry="95" />
        <path d="M120 32v222M30 145h180" />
      </g>
      <g stroke="currentColor" strokeWidth=".6" opacity=".35">
        {neuralLinks.map(({ point, other, key }) => (
          <path key={key} d={`M${point[0]} ${point[1]}L${other[0]} ${other[1]}`} />
        ))}
      </g>
      <g fill="currentColor">
        {neuralPoints.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 7 === 0 ? 2 : 1}
            opacity={i % 3 === 0 ? '.9' : '.45'}
          />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".8">
        <path d="M117 42c-24-9-43 11-44 25-20 3-32 24-26 42-17 14-18 43-8 59-5 24 12 44 26 46 2 25 26 40 49 30zm6 0c24-9 43 11 44 25 20 3 32 24 26 42 17 14 18 43 8 59 5 24-12 44-26 46-2 25-26 40-49 30z" />
        <path d="M89 67c-16 14-2 34 14 38M61 103c20-8 39 8 27 27M48 150c12-9 27-3 31 10s-2 26-18 25M98 142c-17 13-7 36 6 43M82 202c-2 17 13 25 24 22M151 67c16 14 2 34-14 38M179 103c-20-8-39 8-27 27M192 150c-12-9-27-3-31 10s2 26 18 25M142 142c17 13 7 36-6 43M158 202c2 17-13 25-24 22" />
      </g>
      <text
        x="120"
        y="281"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7"
        fontFamily="monospace"
        letterSpacing="2"
      >
        NIMPH / NEURAL MAPPING
      </text>
    </svg>
  );
}

function DamageDisplay({ ratio, children, kind, onClick }) {
  const level =
    ratio === 0 ? 'offline' : ratio <= 0.25 ? 'critical' : ratio <= 0.6 ? 'unstable' : 'stable';
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      className={`damage-display ${kind}`}
      data-damage={level}
      style={{
        '--damage': 1 - ratio,
        '--damage-opacity': (1 - ratio) * 0.75,
        '--image-saturation': ratio,
        '--image-contrast': 1 + (1 - ratio) * 0.6,
      }}
      onClick={onClick}
      aria-label={onClick ? 'Alterar foto de identificação' : undefined}
    >
      <div className="damage-image">{children}</div>
      <div className="damage-fragments" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="damage-static" aria-hidden="true" />
      <span className="damage-cross" aria-hidden="true">
        +
      </span>
      <span className="damage-signal">
        {ratio === 0 ? 'SEM SINAL' : `SINAL ${Math.round(ratio * 100)}%`}
      </span>
    </Wrapper>
  );
}

function FlipButton({ back, onClick, disabled }) {
  return (
    <button
      className={`tablet-flip ${back ? 'return' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={back ? 'Virar tablet para a frente' : 'Virar tablet para o verso'}
    >
      <span className="flip-triangle" />
      <span className="flip-caption">{back ? 'FRENTE' : 'VERSO'}</span>
    </button>
  );
}

function Resource({ id, value, max, onChange, disabled }) {
  const label = id === 'hp' ? 'Pontos de vida' : 'Energia';
  return (
    <section className={`tablet-resource ${id}`} aria-label={label}>
      <div className="resource-top">
        <span>{id === 'hp' ? 'HP / VITALIDADE' : 'EN / ENERGIA'}</span>
        <span className="resource-controls">
          <button
            type="button"
            aria-label={`Diminuir ${label}`}
            disabled={disabled || value <= 0}
            onClick={() => onChange(id, value - 1)}
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            aria-label={`Aumentar ${label}`}
            disabled={disabled || value >= max}
            onClick={() => onChange(id, value + 1)}
          >
            <Plus size={14} />
          </button>
        </span>
      </div>
      <div className="tablet-resource-value">
        <strong>{String(value).padStart(2, '0')}</strong>
        <span>/ {String(max).padStart(2, '0')}</span>
      </div>
      <div
        className="tablet-meter"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, max)}
        aria-valuenow={value}
      >
        <span
          style={{ width: `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%` }}
        />
      </div>
    </section>
  );
}

function AttributeDetail({ group, character, index, onClose }) {
  const dialog = useRef();
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal tablet-detail"
      aria-label={`Detalhes de ${group.label}`}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="detail-top">
        <span>LEITURA DE ATRIBUTO / {group.code}</span>
        <button className="icon-button" aria-label="Fechar detalhes do atributo" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <AttributeCard group={group} character={character} index={index} />
      <p className="detail-note">
        Valores individuais. O atributo base não é somado automaticamente.
        {group.skills.some((skill) => skill.id === 'intuition') && character.intuitionNote
          ? ` Intuição: ${character.intuitionNote}.`
          : ''}
      </p>
    </dialog>
  );
}

export default function Tablet({ user, settings, status, effects, busy, mutate, onOpenSettings }) {
  const { character } = user;
  const [back, setBack] = useState(false);
  const [turning, setTurning] = useState(false);
  const [detail, setDetail] = useState(null);
  const device = useRef();
  const hasFlipped = useRef(false);
  const timer = useRef();
  const draftKey = `psci-draft-${user.id}`;
  const [draft, setDraft] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (saved) return saved;
    } catch {
      /* Use the saved character data. */
    }
    return {
      notes: character.notes || '',
      equipment: character.equipment || '',
      abilities: character.abilities || '',
    };
  });
  const baseline = useRef({
    notes: character.notes || '',
    equipment: character.equipment || '',
    abilities: character.abilities || '',
  });
  const dirtyFields = Object.keys(draft).filter((key) => draft[key] !== baseline.current[key]);
  const dirty = dirtyFields.length > 0;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!turning && hasFlipped.current) {
      device.current
        ?.querySelector(back ? '.device-back .tablet-flip' : '.device-front .tablet-flip')
        ?.focus({ preventScroll: true });
    }
  }, [back, turning]);
  useEffect(() => {
    // Reconcile remote updates per field, preserving locally edited fields.
    const previous = baseline.current;
    const latest = {
      notes: character.notes || '',
      equipment: character.equipment || '',
      abilities: character.abilities || '',
    };
    baseline.current = latest;
    setDraft((current) => {
      const next = { ...current };
      for (const key of ['notes', 'equipment', 'abilities']) {
        if (current[key] === previous[key]) next[key] = latest[key];
      }
      return next;
    });
  }, [character.notes, character.equipment, character.abilities]);
  useEffect(() => {
    try {
      if (dirty) sessionStorage.setItem(draftKey, JSON.stringify(draft));
      else sessionStorage.removeItem(draftKey);
    } catch {
      /* Editing still works when browser storage is unavailable. */
    }
  }, [draft, dirty, draftKey]);
  async function save() {
    const submitted = { ...draft };
    const patch = Object.fromEntries(dirtyFields.map((key) => [key, draft[key]]));
    const result = await mutate('/me', patch, 'Registros de campo sincronizados.');
    if (result) {
      const saved = Object.fromEntries(
        ['notes', 'equipment', 'abilities'].map((key) => [key, result.user.character[key] || '']),
      );
      baseline.current = saved;
      setDraft((current) =>
        Object.fromEntries(
          Object.keys(saved).map((key) => [
            key,
            current[key] === submitted[key] ? saved[key] : current[key],
          ]),
        ),
      );
    }
  }
  function flip() {
    if (turning) return;
    hasFlipped.current = true;
    setTurning(true);
    setBack((value) => !value);
    clearTimeout(timer.current);
    const animated = effects && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(
      () => {
        setTurning(false);
      },
      animated ? 850 : 0,
    );
  }
  const { maxHp, maxEnergy, ac } = getVitals(character);
  const ratio = Math.max(0, Math.min(1, character.vitals.hp / Math.max(1, maxHp)));
  const offline = status !== 'online';
  const fallbackName =
    character.serial === 'PSCI-CMD'
      ? 'COMANDO'
      : `UNIDADE ${character.serial.replace('PSCI-', '').replace(/^0+/, '').padStart(2, '0')}`;
  const group = settings.schema.find((item) => item.id === detail);
  return (
    <>
      <div className="tablet-layout">
        <aside className="device-caption">
          <span className="caption-cross">+</span>
          <span className="device-caption-code">
            PERSONAL
            <br />
            SISTEM
            <br />
            CARD ID.
          </span>
          <div className="caption-divider" />
          <span className="caption-eyebrow">{back ? '02 / REGISTROS' : '01 / IDENTIDADE'}</span>
          <span className="caption-serial">{character.serial}</span>
          <span className="caption-small">
            EQUIPAMENTO PESSOAL
            <br />
            DE EXPEDIÇÃO
          </span>
        </aside>
        <div className="tablet-perspective">
          <div
            className={`psci-device ${back ? 'is-flipped' : ''} ${turning ? 'is-turning' : ''}`}
            ref={device}
            data-face={back ? 'back' : 'front'}
            style={{ '--hp-ratio': ratio }}
          >
            <section
              className="device-face device-front"
              aria-label="Frente do tablet: identidade e atributos"
              aria-hidden={back}
              inert={back}
            >
              <Housing />
              <div className="portrait-module">
                <div className="module-header">
                  <span>IDENTIFICAÇÃO</span>
                  <ScanFace size={10} />
                </div>
                <DamageDisplay kind="portrait" ratio={ratio} onClick={onOpenSettings}>
                  {character.photo ? (
                    <img
                      className="tablet-portrait"
                      src={character.photo}
                      alt={`Foto de perfil de ${character.name || user.username}`}
                    />
                  ) : (
                    <PortraitPlaceholder />
                  )}
                </DamageDisplay>
                <div className="module-footer">
                  <Fingerprint size={10} />
                  <span>{character.serial}</span>
                </div>
              </div>
              <div className="device-nameplate">
                <span className="nameplate-mark">///</span>
                <span>P.S.C.I</span>
                <i />
              </div>
              <header className="tablet-identity">
                <span className="tablet-micro">
                  {character.designation || 'UNIDADE DE EXPEDIÇÃO'}
                </span>
                <h1>{character.name || fallbackName}</h1>
                <dl>
                  <div>
                    <dt>MODELO</dt>
                    <dd>{character.model || 'Não definido'}</dd>
                  </div>
                  <div>
                    <dt>AFILIAÇÃO</dt>
                    <dd className="identity-affiliation">
                      {character.affiliation || 'Não definida'}
                    </dd>
                  </div>
                  <div>
                    <dt>ESQUADRÃO</dt>
                    <dd>{character.squad || 'Não designado'}</dd>
                  </div>
                </dl>
              </header>
              <div className="front-main-screen">
                <div className="tablet-screen-topline">
                  <span>
                    <i className={`status-dot ${offline ? 'warning' : ''}`} />
                    {offline ? 'CONSULTA LOCAL' : 'UNIDADE REGISTRADA'}
                  </span>
                  <span>REV. 02</span>
                </div>
                <div className="tablet-vitals">
                  <Resource
                    id="hp"
                    value={character.vitals.hp}
                    max={maxHp}
                    disabled={offline || busy}
                    onChange={(id, value) => mutate('/me', { vitals: { [id]: value } }, '')}
                  />
                  <div className="tablet-secondary-vitals">
                    <Resource
                      id="energy"
                      value={character.vitals.energy}
                      max={maxEnergy}
                      disabled={offline || busy}
                      onChange={(id, value) => mutate('/me', { vitals: { [id]: value } }, '')}
                    />
                    <section className="tablet-armor" aria-label="Classe de armadura">
                      <span>AC / ARMADURA</span>
                      <strong>{ac}</strong>
                      <span className="armor-caption">DEFESA PASSIVA</span>
                    </section>
                  </div>
                </div>
                <div className="tablet-matrix-heading">
                  <h2>ATRIBUTOS / PERÍCIAS</h2>
                  <span>
                    TOQUE PARA EXPANDIR <ArrowUpRight size={9} />
                  </span>
                </div>
                <div className="tablet-attributes">
                  {settings.schema.map((item, index) => (
                    <button
                      className="tablet-attribute"
                      key={item.id}
                      aria-label={`Detalhes de ${item.label}`}
                      onClick={() => setDetail(item.id)}
                    >
                      <span className="tablet-attribute-heading">
                        <span>
                          <small>
                            {String(index + 1).padStart(2, '0')} / {item.code}
                          </small>
                          <strong>{item.label}</strong>
                        </span>
                        <b>{formatModifier(character.attributes[item.id])}</b>
                      </span>
                      <span className="tablet-skills">
                        {item.skills.map((skill) => (
                          <span className="tablet-skill" key={skill.id}>
                            <span>
                              {skill.label}
                              {skill.id === 'intuition' && character.intuitionNote ? (
                                <i title={character.intuitionNote}>*</i>
                              ) : null}
                            </span>
                            <span className={character.skills[skill.id] == null ? 'unset' : ''}>
                              {formatModifier(character.skills[skill.id])}
                            </span>
                          </span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
                <footer className="tablet-screen-footer">
                  <span>— NÃO DEFINIDO</span>
                  <span>BASE / VALORES INDIVIDUAIS</span>
                </footer>
              </div>
              <span className="housing-stencil front-stencil">
                FIELD TERMINAL · DISPOSABLE SERIES
              </span>
              <FlipButton back={false} onClick={flip} disabled={turning} />
            </section>
            <section
              className="device-face device-back"
              aria-label="Verso do tablet: diário, equipamento e habilidades"
              aria-hidden={!back}
              inert={!back}
            >
              <Housing back />
              <FlipButton back onClick={flip} disabled={turning} />
              <div className="back-main-screen">
                <div className="back-screen-heading">
                  <span className="tablet-micro">MEMÓRIA DE EXPEDIÇÃO</span>
                  <span className={`draft-status ${dirty ? 'unsaved' : ''}`}>
                    <i />
                    {dirty ? 'RASCUNHO LOCAL' : 'SINCRONIZADO'}
                  </span>
                </div>
                <section className="tablet-diary">
                  <div className="tablet-editor-heading">
                    <h2>DIÁRIO</h2>
                    <button
                      className="tablet-save"
                      disabled={!dirty || busy || offline}
                      onClick={save}
                      aria-label="Salvar registros de campo"
                    >
                      {busy ? (
                        <Radio size={12} />
                      ) : dirty ? (
                        <Save size={12} />
                      ) : (
                        <Check size={12} />
                      )}
                      <span>{busy ? 'SALVANDO' : 'SALVAR'}</span>
                    </button>
                  </div>
                  <div className="editor-inset">
                    <label className="sr-only" htmlFor="tablet-notes">
                      Anotações de campo
                    </label>
                    <textarea
                      id="tablet-notes"
                      disabled={offline}
                      maxLength={12000}
                      placeholder="A superfície guarda histórias. Registre a sua..."
                      value={draft.notes}
                      onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    />
                    <span className="editor-counter">
                      {String(draft.notes.length).padStart(3, '0')} / 12000
                    </span>
                  </div>
                </section>
                <div className="tablet-back-columns">
                  <section className="tablet-equipment">
                    <h2>EQUIPAMENTOS</h2>
                    <div className="editor-inset">
                      <label className="sr-only" htmlFor="tablet-equipment">
                        Equipamento de campo
                      </label>
                      <textarea
                        id="tablet-equipment"
                        disabled={offline}
                        maxLength={12000}
                        placeholder="Armas, suprimentos e itens de campo..."
                        value={draft.equipment}
                        onChange={(e) => setDraft({ ...draft, equipment: e.target.value })}
                      />
                    </div>
                    <span className="equipment-footnote">CARGA PESSOAL / REGISTRO LIVRE</span>
                  </section>
                  <section className="tablet-abilities">
                    <h2>HABILIDADES</h2>
                    <div className="editor-inset">
                      <label className="sr-only" htmlFor="tablet-abilities">
                        Habilidades da unidade
                      </label>
                      <textarea
                        id="tablet-abilities"
                        disabled={offline}
                        maxLength={12000}
                        placeholder="Técnicas e habilidades da sua unidade..."
                        value={draft.abilities}
                        onChange={(e) => setDraft({ ...draft, abilities: e.target.value })}
                      />
                    </div>
                  </section>
                </div>
              </div>
              <div className="neural-module">
                <div className="module-header">
                  <span>NEURAL LINK</span>
                  <span>01</span>
                </div>
                <DamageDisplay kind="neural" ratio={ratio}>
                  <NeuralPlaceholder />
                </DamageDisplay>
                <div className="module-footer">
                  <span>NIMPH</span>
                  <span>{Math.round(ratio * 100)}%</span>
                </div>
              </div>
              <div className="back-telemetry">
                <span className="telemetry-title">PERSONAL LINK</span>
                <div className="telemetry-bars" aria-hidden="true">
                  {Array.from({ length: 20 }, (_, i) => (
                    <i key={i} className={i / 20 < ratio ? 'lit' : ''} />
                  ))}
                </div>
                <span>
                  {ratio <= 0.25 ? 'INTEGRIDADE VISUAL CRÍTICA' : 'MEMÓRIA DE CAMPO ATIVA'}
                </span>
                <span className="back-serial">{character.serial}</span>
              </div>
            </section>
          </div>
        </div>
        <aside className="device-ruler" aria-hidden="true">
          <span>ARK / FIELD SYSTEMS</span>
          <div />
          <span>PSCI — 00.2</span>
        </aside>
      </div>
      <div className="device-bottom-caption">
        <span className="face-indicator">
          <i className={!back ? 'active' : ''} />
          <i className={back ? 'active' : ''} />
          {back ? 'VERSO / MEMÓRIA DE CAMPO' : 'FRENTE / IDENTIDADE OPERACIONAL'}
        </span>
        <span>PRESSIONE A SETA PARA VIRAR O TERMINAL</span>
      </div>
      <div className="tablet-broadcast">
        <Radio size={12} />
        <span>{settings.broadcast || 'Nenhum comunicado ativo.'}</span>
      </div>
      {group && (
        <AttributeDetail
          group={group}
          character={character}
          index={settings.schema.findIndex((item) => item.id === group.id)}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
