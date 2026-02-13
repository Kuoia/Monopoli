const STORAGE_KEY = 'monopoly-contable-iva-v1';

export const board = [
  { type: 'start', name: 'Salida' },
  { type: 'street', name: 'Calle Serrano', base: 3000, group: 'A' },
  { type: 'question', name: 'Interrogación' },
  { type: 'street', name: 'Gran Vía', base: 2600, group: 'A' },
  { type: 'creditPurchase', name: 'Compra a crédito' },
  { type: 'street', name: 'Castellana', base: 3500, group: 'B' },
  { type: 'loan', name: 'Préstamo' },
  { type: 'street', name: 'Goya', base: 2400, group: 'B' },
  { type: 'sale', name: 'Venta con IVA' },
  { type: 'street', name: 'Alcalá', base: 2200, group: 'C' },
  { type: 'grant', name: 'Subvención' },
  { type: 'street', name: 'Diagonal', base: 2800, group: 'C' },
  { type: 'question', name: 'Interrogación' },
  { type: 'street', name: 'Velázquez', base: 3200, group: 'D' },
  { type: 'street', name: 'Rambla Catalunya', base: 2500, group: 'D' },
  { type: 'creditPurchase', name: 'Compra a crédito' },
  { type: 'street', name: 'Princesa', base: 2100, group: 'E' },
  { type: 'street', name: 'Plaza España', base: 2700, group: 'E' },
  { type: 'sale', name: 'Venta con IVA' },
  { type: 'street', name: 'Avenida América', base: 2300, group: 'F' },
  { type: 'vatSettlement', name: 'Liquidación IVA' },
  { type: 'street', name: 'Passeig de Gràcia', base: 3400, group: 'F' },
  { type: 'question', name: 'Interrogación' },
  { type: 'question', name: 'Pregunta del profesor' }
];

const defaultTeams = [
  { name: 'Equipo 1', color: '#d7263d' },
  { name: 'Equipo 2', color: '#1b9aaa' },
  { name: 'Equipo 3', color: '#f4a261' },
  { name: 'Equipo 4', color: '#6a4c93' }
].map((t, idx) => ({
  ...t,
  id: idx,
  bank: 10000,
  vatInput: 0,
  vatOutput: 0,
  liabilities: 0,
  equityBonus: 0,
  propertiesValue: 0,
  position: 0,
  laps: 0,
  loans: [],
  properties: {}
}));

export const createInitialState = () => ({
  currentTeam: 0,
  teams: defaultTeams,
  inProgress: false,
  allowNegativeBank: false,
  questionReward: 500,
  message: ''
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function calcNetWorth(team) {
  return team.bank + team.propertiesValue - team.liabilities + team.equityBonus;
}
