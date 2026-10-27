import { useEffect, useRef, useState } from 'react';
import { Fingerprint, Pencil, Save, Undo2 } from 'lucide-react';
import { Field, attributeIcons } from './components.jsx';
import PhotoEditor from './PhotoEditor.jsx';
import { getVitals } from '../shared/schema.js';

export default function PlayerEditor({
  character,
  schema,
  initialSection,
  mutate,
  busy,
  offline,
  notify,
}) {
  const [patch, setPatch] = useState({});
  const form = useRef();
  const draft = {
    ...character,
    ...patch,
    attributes: { ...character.attributes, ...patch.attributes },
    skills: { ...character.skills, ...patch.skills },
  };
  const changes = {};
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'attributes' || key === 'skills') {
      const entries = Object.entries(value).filter(
        ([id, score]) => score !== (character[key][id] ?? null),
      );
      if (entries.length) changes[key] = Object.fromEntries(entries);
    } else if (value !== character[key]) changes[key] = value;
  }
  const dirty = Object.keys(changes).length > 0;
  const { maxHp, ac } = getVitals(draft);
  useEffect(() => {
    if (!initialSection) return;
    const frame = requestAnimationFrame(() =>
      form.current
        ?.querySelector(`[data-attribute="${initialSection}"]`)
        ?.scrollIntoView({ block: 'start' }),
    );
    return () => cancelAnimationFrame(frame);
  }, [initialSection]);
  function update(key, value) {
    setPatch((current) => ({ ...current, [key]: value }));
  }
  function number(key, id, value) {
    setPatch((current) => ({
      ...current,
      [key]: { ...current[key], [id]: value === '' ? null : Number(value) },
    }));
  }
  async function submit(event) {
    event.preventDefault();
    if (!dirty || busy || offline) return;
    if (await mutate('/me', changes, 'Ficha pessoal sincronizada.')) setPatch({});
  }
  return (
    <form ref={form} className="player-editor page-stack" onSubmit={submit}>
      <div className="player-editor-intro">
        <div>
          <span className="eyebrow orange">EDIÇÃO DA UNIDADE</span>
          <h2>Minha ficha</h2>
          <p>Edite seus dados e parâmetros. O comando recebe as alterações em tempo real.</p>
        </div>
        <span className="pill">{dirty ? 'ALTERAÇÕES LOCAIS' : 'SINCRONIZADO'}</span>
      </div>
      <fieldset disabled={busy || offline}>
        <section className="panel form-panel">
          <div className="panel-heading">
            <Fingerprint size={18} />
            <h3>Identificação</h3>
          </div>
          <div className="form-grid">
            {[
              ['name', 'NOME'],
              ['model', 'MODELO'],
              ['affiliation', 'AFILIAÇÃO'],
              ['squad', 'ESQUADRÃO'],
              ['designation', 'FUNÇÃO / DESIGNAÇÃO'],
              ['intuitionNote', 'NOTA DO BÔNUS DE INTUIÇÃO'],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  value={draft[key] || ''}
                  maxLength={150}
                  placeholder="Não definido"
                  onChange={(event) => update(key, event.target.value)}
                />
              </Field>
            ))}
          </div>
        </section>
        <section className="panel form-panel">
          <PhotoEditor
            value={draft.photo}
            onChange={(photo) => update('photo', photo)}
            disabled={busy || offline}
            notify={notify}
          />
        </section>
        <div className="player-calculated">
          <span>PRÉVIA DOS RECURSOS</span>
          <strong>HP MÁX. {maxHp}</strong>
          <strong>AC {ac}</strong>
          <small>O HP atual é preservado até o limite máximo.</small>
        </div>
        <div className="admin-attributes player-attributes">
          {schema.map((group) => {
            const Icon = attributeIcons[group.id] || Pencil;
            return (
              <section className="panel admin-attribute" data-attribute={group.id} key={group.id}>
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
                      onChange={(event) => number('attributes', group.id, event.target.value)}
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
                        onChange={(event) => number('skills', skill.id, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <p className="small-note">
          Deixe uma perícia em branco para mantê-la como “—”. Os valores são individuais, sem soma
          automática com o atributo base.
        </p>
        <div className="sticky-save">
          <span>
            <i className={`status-dot ${dirty ? 'warning' : ''}`} />
            {dirty ? 'ALTERAÇÕES NÃO SALVAS' : 'FICHA SINCRONIZADA'}
          </span>
          <div className="player-save-actions">
            <button
              type="button"
              className="button secondary small"
              disabled={!dirty || busy || offline}
              onClick={() => setPatch({})}
            >
              <Undo2 size={14} />
              DESCARTAR
            </button>
            <button type="submit" className="button primary" disabled={!dirty || busy || offline}>
              <Save size={16} />
              {busy ? 'SALVANDO...' : 'SALVAR MINHA FICHA'}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
