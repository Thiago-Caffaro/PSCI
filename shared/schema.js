export const DEFAULT_SCHEMA = [
  {
    id: 'constitution',
    label: 'Constituição',
    code: 'CON',
    skills: [
      { id: 'resistance', label: 'Resistência' },
      { id: 'integrity', label: 'Integridade' },
    ],
  },
  {
    id: 'strength',
    label: 'Força',
    code: 'FOR',
    skills: [
      { id: 'athletics', label: 'Atletismo' },
      { id: 'fight', label: 'Luta' },
      { id: 'aim', label: 'Mira' },
    ],
  },
  {
    id: 'agility',
    label: 'Agilidade',
    code: 'AGI',
    skills: [
      { id: 'dexterity', label: 'Destreza' },
      { id: 'stealth', label: 'Furtividade' },
      { id: 'accuracy', label: 'Pontaria' },
      { id: 'combat', label: 'Combate' },
      { id: 'initiative', label: 'Iniciativa' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Conhecimento',
    code: 'CONH',
    skills: [
      { id: 'intuition', label: 'Intuição' },
      { id: 'history', label: 'História' },
      { id: 'survival', label: 'Sobrevivência' },
      { id: 'investigation', label: 'Investigação' },
      { id: 'perception', label: 'Percepção' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Inteligência',
    code: 'INT',
    skills: [
      { id: 'engineering', label: 'Engenharia' },
      { id: 'technology', label: 'Tecnologia' },
      { id: 'computing', label: 'Computação' },
      { id: 'biology', label: 'Biologia' },
    ],
  },
  {
    id: 'charisma',
    label: 'Carisma',
    code: 'CAR',
    skills: [
      { id: 'persuasion', label: 'Persuasão' },
      { id: 'deception', label: 'Enganação' },
      { id: 'performance', label: 'Performance' },
      { id: 'intimidation', label: 'Intimidação' },
    ],
  },
];

export const DEFAULT_SETTINGS = {
  operation: 'Expedição 001',
  sector: 'Superfície / setor não designado',
  broadcast: 'Mantenha seu PSCI conectado. Nenhuma unidade fica para trás.',
  schema: DEFAULT_SCHEMA,
};

export function createCharacter(serial = 'PSCI-0001') {
  return {
    serial,
    name: '',
    model: '',
    affiliation: 'Micilis',
    squad: '',
    designation: 'Unidade de expedição',
    photo: '',
    attributes: {
      constitution: -1,
      strength: 1,
      agility: 1,
      knowledge: 0,
      intelligence: 0,
      charisma: -1,
    },
    skills: {
      resistance: null,
      integrity: null,
      athletics: 1,
      fight: null,
      aim: 1,
      dexterity: 1,
      stealth: null,
      accuracy: 1,
      combat: null,
      initiative: null,
      intuition: 2,
      history: null,
      survival: null,
      investigation: null,
      perception: null,
      engineering: null,
      technology: 1,
      computing: 1,
      biology: null,
      persuasion: null,
      deception: null,
      performance: -1,
      intimidation: 1,
    },
    intuitionNote: '1 base + 1 bônus Micilis',
    vitals: { hp: 20, energy: 5 },
    notes: '',
    equipment: '',
    abilities: '',
  };
}

export function getVitals(character) {
  return {
    maxHp: 20 + 5 * (character.skills.resistance ?? 0),
    maxEnergy: 5,
    ac: 10 + (character.attributes.agility ?? 0),
  };
}

export function formatModifier(value) {
  return value == null ? '—' : value > 0 ? `+${value}` : String(value);
}
