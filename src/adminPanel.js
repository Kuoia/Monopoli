import { calcNetWorth } from './gameState.js';
import { teamSummary } from './financeEngine.js';

export function renderAdminPanel(state, actions) {
  const el = document.getElementById('admin-panel');
  const options = state.teams.map((t, i) => `<option value="${i}">${t.name}</option>`).join('');
  el.innerHTML = `
    <h3>Panel Profesor</h3>
    <label><input type="checkbox" id="toggle-negative" ${state.allowNegativeBank ? 'checked' : ''}/> Permitir banco negativo</label>
    <label>Premio interrogación <input type="number" id="question-prize" value="${state.questionReward}" /></label>
    <label>Editar banco equipo
      <select id="team-target">${options}</select>
      <input type="number" id="bank-value" placeholder="Nuevo saldo" />
    </label>
    <button id="btn-edit-bank">Aplicar saldo banco</button>
    <button id="btn-force-transfer">Forzar +500€ al equipo activo</button>
    <button id="btn-end">Finalizar partida</button>
    <button id="btn-reset">Reiniciar partida</button>
    <div id="admin-msg"></div>
  `;
  el.querySelector('#toggle-negative').onchange = (e) => actions.setAllowNegative(e.target.checked);
  el.querySelector('#question-prize').onchange = (e) => actions.setQuestionReward(Number(e.target.value || 500));
  el.querySelector('#btn-edit-bank').onclick = () => {
    const idx = Number(el.querySelector('#team-target').value);
    const value = Number(el.querySelector('#bank-value').value);
    actions.editBank(idx, value);
  };
  el.querySelector('#btn-force-transfer').onclick = () => actions.forceTransfer();
  el.querySelector('#btn-reset').onclick = () => actions.reset();
  el.querySelector('#btn-end').onclick = () => actions.endGame();

  const warnings = state.teams.filter((t) => t.bank < 0 || calcNetWorth(t) < 0)
    .map((t) => `${t.name}: banco ${t.bank < 0 ? 'negativo' : 'ok'}, PN ${calcNetWorth(t) < 0 ? 'negativo' : 'ok'}`);
  if (warnings.length) {
    el.querySelector('#admin-msg').innerHTML = `<p class="warn">Alerta: ${warnings.join(' | ')}</p>`;
  }
}

export function showRanking(state) {
  const modal = document.getElementById('ranking-modal');
  const root = document.getElementById('ranking-content');
  const rows = [...state.teams]
    .map((t) => ({ name: t.name, ...teamSummary(t) }))
    .sort((a, b) => b.netWorth - a.netWorth)
    .map((t, i) => `<tr><td>${i + 1}</td><td>${t.name}</td><td>${fmt(t.bank)}</td><td>${fmt(t.propertiesValue)}</td><td>${fmt(t.liabilities)}</td><td>${fmt(t.vatPending)}</td><td>${fmt(t.netWorth)}</td></tr>`)
    .join('');

  root.innerHTML = `<div class="modal-wrap ranking"><h2>Ranking final</h2>
    <table><thead><tr><th>#</th><th>Equipo</th><th>Banco</th><th>Valor propiedades</th><th>Pasivo</th><th>IVA pendiente</th><th>PN final</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="actions"><button id="close-ranking">Cerrar</button></div>
  </div>`;
  root.querySelector('#close-ranking').onclick = () => modal.close();
  modal.showModal();
}

function fmt(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
