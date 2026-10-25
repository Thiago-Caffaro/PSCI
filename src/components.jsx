import { Children, cloneElement, isValidElement, useId } from 'react';
import {
  Activity,
  BicepsFlexed,
  Brain,
  Crosshair,
  Heart,
  Minus,
  Plus,
  Radio,
  ScanFace,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatModifier, getVitals } from '../shared/schema.js';

export const attributeIcons = {
  constitution: Shield,
  strength: BicepsFlexed,
  agility: Crosshair,
  knowledge: ScanFace,
  intelligence: Brain,
  charisma: Sparkles,
};

export function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'compact' : ''}`}>
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <>
          <span className="brand-word">
            PSCI<span>®</span>
          </span>
          <span className="brand-caption">
            PERSONAL SISTEM
            <br />
            CARD ID
          </span>
        </>
      )}
    </div>
  );
}

export function UnitSchematic({ large = false }) {
  const id = useId().replaceAll(':', '');
  return (
    <div className={`schematic ${large ? 'large' : ''}`} aria-hidden="true">
      <div className="schematic-grid" />
      <div className="schematic-cross top" />
      <div className="schematic-cross bottom" />
      <svg viewBox="0 0 320 320" fill="none" className="unit-figure">
        <defs>
          <linearGradient
            id={`body-${id}`}
            x1="160"
            y1="30"
            x2="160"
            y2="310"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#777a80" stopOpacity=".28" />
            <stop offset="1" stopColor="#27292d" stopOpacity=".1" />
          </linearGradient>
        </defs>
        <g stroke="#4a4c52" strokeWidth=".65">
          <circle cx="160" cy="149" r="113" />
          <circle cx="160" cy="149" r="91" strokeDasharray="2 7" />
          <path d="M22 149h276M160 12v276M61 51l198 198M61 249 259 51" opacity=".6" />
        </g>
        <g fill={`url(#body-${id})`} stroke="#9b9da4" strokeWidth="1.15" strokeLinejoin="round">
          <path d="m137 55 23-9 23 9 10 23-4 41-14 21h-30l-14-21-4-41z" />
          <path d="m131 87 16-13h26l16 13-8 18h-42zM144 125l16 9 16-9M146 140l-5 17 19 15 19-15-5-17" />
          <path d="m141 151-39 18-16 30 22 36 13-8 5 40 34 18 34-18 5-40 13 8 22-36-16-30-39-18-19 21z" />
          <path d="m102 169 25 12 10 41 23 17 23-17 10-41 25-12M127 181l33 10 33-10M137 222h46M160 191v48M126 246l34 20 34-20M126 267l-13 39h94l-13-39M86 199l-16 61 21 13 17-38M234 199l16 61-21 13-17-38M70 260l-8 42 20 7 9-36M250 260l8 42-20 7-9-36" />
        </g>
        <g stroke="#ff6844" strokeWidth="1.2">
          <path d="M138 93h44M151 112h18M150 202h20v12h-20zM111 176l-13 22M209 176l13 22" />
          <path d="M184 64h53l16-16M194 219h48l18 18M124 267H77l-22-22" opacity=".6" />
          <circle cx="184" cy="64" r="2.5" fill="#ff6844" />
          <circle cx="194" cy="219" r="2.5" fill="#ff6844" />
        </g>
        <g fill="#74777e" fontSize="6.5" fontFamily="monospace">
          <text x="241" y="42">
            NIMPH / 01
          </text>
          <text x="245" y="248">
            CORE LINK
          </text>
          <text x="27" y="239">
            FRAME ID
          </text>
        </g>
      </svg>
      <div className="scan-beam" />
      <span className="schematic-caption">ESTRUTURA SINTÉTICA / VISUALIZAÇÃO</span>
    </div>
  );
}

export function SectionHeading({ code, title, children }) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-code">{code}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function AttributeCard({ group, character, index, compact = false }) {
  const Icon = attributeIcons[group.id] || Activity;
  const value = character.attributes[group.id];
  return (
    <section className={`attribute-card ${compact ? 'condensed' : ''}`}>
      <header>
        <span className="attribute-icon">
          <Icon size={19} strokeWidth={1.5} />
        </span>
        <div className="attribute-title">
          <span className="eyebrow">ATRIBUTO {String(index + 1).padStart(2, '0')}</span>
          <h3>{group.label}</h3>
        </div>
        <span className={`attribute-value ${value > 0 ? 'positive' : value < 0 ? 'negative' : ''}`}>
          {formatModifier(value)}
        </span>
      </header>
      <div className="skill-list">
        {group.skills.map((skill) => (
          <div className="skill-row" key={skill.id}>
            <span>
              {skill.label}
              {skill.id === 'intuition' && character.intuitionNote && (
                <span
                  className="skill-bonus"
                  title={character.intuitionNote}
                  aria-label={character.intuitionNote}
                >
                  BÔNUS
                </span>
              )}
            </span>
            <span
              className={`skill-value ${character.skills[skill.id] == null ? 'unset' : character.skills[skill.id] > 0 ? 'positive' : ''}`}
            >
              {formatModifier(character.skills[skill.id])}
            </span>
          </div>
        ))}
      </div>
      <footer>
        <span>{group.code} / BASE</span>
        <span>{group.skills.length} PERÍCIAS</span>
      </footer>
    </section>
  );
}

export function Vitals({ character, onChange, disabled }) {
  const { maxHp, maxEnergy, ac } = getVitals(character);
  const resources = [
    {
      id: 'hp',
      label: 'Pontos de vida',
      short: 'HP',
      max: maxHp,
      icon: Heart,
      hint: `20 + (5 × Resistência${character.skills.resistance == null ? ' [não definida: 0 na prévia]' : ''})`,
    },
    {
      id: 'energy',
      label: 'Energia',
      short: 'EN',
      max: maxEnergy,
      icon: Zap,
      hint: 'Reserva de energia / máximo 5',
    },
  ];
  return (
    <div className="vitals-grid">
      {resources.map(({ id, label, short, max, icon: Icon, hint }) => {
        const value = character.vitals[id];
        return (
          <section className={`vital-card ${id}`} key={id} aria-label={label}>
            <header>
              <span className="eyebrow">
                <Icon size={14} /> {label}
              </span>
              <span className="vital-code">{short}</span>
            </header>
            <div className="vital-reading">
              <strong>{String(value).padStart(2, '0')}</strong>
              <span>/ {String(max).padStart(2, '0')}</span>
              <div className="resource-controls">
                <button
                  className="icon-button"
                  aria-label={`Diminuir ${label}`}
                  disabled={disabled || value <= 0}
                  onClick={() => onChange(id, value - 1)}
                >
                  <Minus size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Aumentar ${label}`}
                  disabled={disabled || value >= max}
                  onClick={() => onChange(id, value + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div
              className="resource-meter"
              role="progressbar"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={Math.max(0, max)}
              aria-valuenow={value}
            >
              {Array.from({ length: id === 'hp' ? 20 : 10 }, (_, i) => (
                <span
                  className={
                    i < (value / Math.max(1, max)) * (id === 'hp' ? 20 : 10) ? 'filled' : ''
                  }
                  key={i}
                />
              ))}
            </div>
            <div className="vital-formula">{hint}</div>
          </section>
        );
      })}
      <section className="vital-card armor">
        <header>
          <span className="eyebrow">
            <Shield size={14} /> Classe de armadura
          </span>
          <span className="vital-code">AC</span>
        </header>
        <div className="vital-reading">
          <strong>{ac}</strong>
          <Shield className="armor-watermark" size={45} strokeWidth={0.8} />
        </div>
        <div className="armor-line">
          <span />
          DEFESA PASSIVA
          <span />
        </div>
        <div className="vital-formula">10 + Agilidade</div>
      </section>
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  const id = useId();
  let controlId = id;
  let assigned = false;
  function associate(nodes) {
    return Children.map(nodes, (child) => {
      if (!isValidElement(child)) return child;
      if (!assigned && ['input', 'select', 'textarea'].includes(child.type)) {
        assigned = true;
        controlId = child.props.id || id;
        return cloneElement(child, {
          id: controlId,
          'aria-describedby': hint ? `${id}-hint` : child.props['aria-describedby'],
        });
      }
      return child.props.children
        ? cloneElement(child, { children: associate(child.props.children) })
        : child;
    });
  }
  const controls = associate(children);
  return (
    <div className={`field ${className}`}>
      <label className="field-label" htmlFor={controlId}>
        {label}
      </label>
      {controls}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <Radio size={30} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
