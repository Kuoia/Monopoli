import { board, calcNetWorth } from './gameState.js';

const pathCoords = [
  [6, 6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [5,0],[4,0],[3,0],[2,0],[1,0],[0,0],
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
  [1,6],[2,6],[3,6],[4,6],[5,6]
];

export function renderBoard(state) {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  const grid = Array.from({ length: 7 }, () => Array(7).fill(null));
  pathCoords.forEach(([r,c], i) => { grid[r][c] = i; });

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const idx = grid[r][c];
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (idx === null) {
        cell.style.background = '#dbe6fb';
        cell.innerHTML = '<div class="title">Monopoly Contable</div>';
      } else {
        const data = board[idx];
        const owner = ownerTag(state, idx);
        cell.innerHTML = `<div class="title">${data.name}</div>
          <div class="sub">${data.base ? `Base ${fmt(data.base)}` : data.type}</div>
          <div class="sub">${owner}</div>
          <div class="tokens" data-pos="${idx}"></div>`;
      }
      boardEl.appendChild(cell);
    }
  }

  state.teams.forEach((team) => {
    const slot = boardEl.querySelector(`.tokens[data-pos="${team.position}"]`);
    if (!slot) return;
    const token = document.createElement('span');
    token.className = 'token';
    token.style.background = team.color;
    token.title = team.name;
    slot.appendChild(token);
  });
}

function ownerTag(state, idx) {
  const owner = state.teams.find((t) => t.properties[idx]);
  if (!owner) return 'Libre';
  return `Prop.: ${owner.name}`;
}

export function renderTeams(state) {
  document.getElementById('turno-actual').textContent = `Turno: ${state.teams[state.currentTeam].name}`;
  const wrap = document.getElementById('teams-panel');
  wrap.innerHTML = '';
  state.teams.forEach((team, i) => {
    const pn = calcNetWorth(team);
    const card = document.createElement('div');
    card.className = 'team-card';
    card.innerHTML = `
      <label>Nombre equipo</label>
      <input data-team-name="${i}" value="${team.name}" />
      <div class="stat-grid">
        <span>Banco:</span><strong>${fmt(team.bank)}</strong>
        <span>IVA soportado:</span><strong>${fmt(team.vatInput)}</strong>
        <span>IVA repercutido:</span><strong>${fmt(team.vatOutput)}</strong>
        <span>Pasivo:</span><strong>${fmt(team.liabilities)}</strong>
        <span>Activo:</span><strong>${fmt(team.propertiesValue)}</strong>
        <span>PN:</span><strong class="${pn < 0 ? 'warn' : 'ok'}">${fmt(pn)}</strong>
      </div>`;
    wrap.appendChild(card);
  });
}

function fmt(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export const boardPath = pathCoords;
