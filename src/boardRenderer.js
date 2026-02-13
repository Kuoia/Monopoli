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
        cell.classList.add('cell-center');
        cell.innerHTML = `<div class="center-wrap">
          <img class="center-gif" src="https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif" alt="Animación profesional del centro del tablero" />
        </div>`;
      } else {
        const data = board[idx];
        const owner = ownerTag(state, idx);
        cell.classList.add(`cell-${data.type}`);
        cell.innerHTML = `<div class="title">${data.name}</div>
          <div class="sub ${data.base ? 'price' : ''}">${data.base ? `Base ${fmt(data.base)}` : labelByType(data.type)}</div>
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
    token.textContent = team.name[0]?.toUpperCase() ?? '•';
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
        <span><abbr title="Banco">Bco.</abbr></span><strong class="money-big">${fmt(team.bank)}</strong>
        <span><abbr title="IVA soportado">IVA sop.</abbr></span><strong class="money-big">${fmt(team.vatInput)}</strong>
        <span><abbr title="IVA repercutido">IVA rep.</abbr></span><strong class="money-big">${fmt(team.vatOutput)}</strong>
        <span><abbr title="Pasivo">Pas.</abbr></span><strong class="money-big">${fmt(team.liabilities)}</strong>
        <span><abbr title="Activo">Act.</abbr></span><strong class="money-big">${fmt(team.propertiesValue)}</strong>
        <span><abbr title="Patrimonio neto">P.N.</abbr></span><strong class="money-big ${pn < 0 ? 'warn' : 'ok'}">${fmt(pn)}</strong>
      </div>`;
    wrap.appendChild(card);
  });
}

function fmt(n) {
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n)} M$`;
}

function labelByType(type) {
  const labels = {
    start: 'Salida',
    street: 'Propiedad',
    question: 'Tarjeta',
    creditPurchase: 'Compra financiada',
    loan: 'Préstamo bancario',
    sale: 'Cobro de venta',
    grant: 'Ayuda',
    vatSettlement: 'Pago IVA'
  };
  return labels[type] ?? type;
}

export const boardPath = pathCoords;
