import { board, createInitialState, loadState, saveState } from './gameState.js';
import { applyLoanMaturity, applyStartContribution, amounts, canApplyBank, rentForProperty } from './financeEngine.js';
import { renderBoard, renderTeams } from './boardRenderer.js';
import { showOperationModal, closeOperationModal } from './modalOperation.js';
import { renderAdminPanel, showRanking } from './adminPanel.js';

let state = loadState();

const btnDado = document.getElementById('btn-dado');
btnDado.onclick = playTurn;

document.getElementById('teams-panel').addEventListener('change', (e) => {
  if (e.target.matches('[data-team-name]')) {
    state.teams[Number(e.target.dataset.teamName)].name = e.target.value || 'Equipo';
    persistAndRender();
  }
});

renderAll();

function renderAll() {
  renderBoard(state);
  renderTeams(state);
  renderAdminPanel(state, {
    setAllowNegative(v) { state.allowNegativeBank = v; persistAndRender(); },
    setQuestionReward(v) { state.questionReward = v; persistAndRender(); },
    editBank(i, value) { if (!Number.isNaN(value)) state.teams[i].bank = value; persistAndRender(); },
    forceTransfer() { state.teams[state.currentTeam].bank += 500; persistAndRender(); },
    reset() { state = createInitialState(); persistAndRender(); },
    endGame() { showRanking(state); }
  });
}

async function playTurn() {
  if (state.inProgress) return;
  state.inProgress = true;
  const team = state.teams[state.currentTeam];
  const { diceOne, diceTwo, total } = rollDice();
  btnDado.textContent = `🎲🎲 ${diceOne} + ${diceTwo} = ${total}`;
  await moveTeam(team, total);
  await resolveCell(team);
  persistAndRender();
  state.currentTeam = (state.currentTeam + 1) % state.teams.length;
  state.inProgress = false;
  btnDado.textContent = '🎲🎲 Tirar dados';
  persistAndRender();
}


function rollDice() {
  const diceOne = 1 + Math.floor(Math.random() * 6);
  const diceTwo = 1 + Math.floor(Math.random() * 6);
  return { diceOne, diceTwo, total: diceOne + diceTwo };
}

async function moveTeam(team, steps) {
  for (let i = 0; i < steps; i++) {
    await delay(230);
    team.position = (team.position + 1) % board.length;
    if (team.position === 0) {
      team.laps += 1;
      applyStartContribution(team);
      const alerts = [];
      applyLoanMaturity(team, alerts);
      if (alerts.length) alert(alerts.join('\n'));
    }
    renderBoard(state);
  }
}

async function resolveCell(team) {
  const cellIndex = team.position;
  const cell = board[cellIndex];

  if (cell.type === 'street') {
    const owner = state.teams.find((t) => t.properties[cellIndex]);
    if (!owner) return await streetPurchase(team, cell, cellIndex);
    if (owner.id === team.id) return await ownStreetOperation(team, cell, cellIndex);
    return await payRent(team, owner, cellIndex);
  }

  if (cell.type === 'creditPurchase') return await creditPurchase(team);
  if (cell.type === 'sale') return await saleOperation(team);
  if (cell.type === 'loan') return await loanOperation(team);
  if (cell.type === 'grant') return await grantOperation(team);
  if (cell.type === 'vatSettlement') return await vatSettlement(team);
  if (cell.type === 'question') return await questionOperation(team);
}

function streetPurchase(team, cell, idx) {
  return promptOperation({
    text: `La empresa adquiere ${cell.name} por ${fmt(cell.base)} + IVA (21%). Pago por banco.`,
    base: cell.base,
    apply: () => {
      const { base, vat, total } = amounts(cell.base);
      if (!canApplyBank(team, -total, state.allowNegativeBank)) return false;
      team.bank -= total;
      team.propertiesValue += base;
      team.vatInput += vat;
      team.properties[idx] = { base, level: 0, group: cell.group, fused: false, combinedValue: base };
      return true;
    }
  });
}

function payRent(payer, owner, idx) {
  const rentBase = rentForProperty(owner.properties[idx]);
  const { vat, total } = amounts(rentBase);
  return promptOperation({
    text: 'Pago por uso de propiedad. Base alquiler: ' + fmt(rentBase) + ' + IVA (21%).',
    base: rentBase,
    apply: () => {
      if (!canApplyBank(payer, -total, state.allowNegativeBank)) return false;
      payer.bank -= total;
      payer.vatInput += vat;
      owner.bank += total;
      owner.vatOutput += vat;
      return true;
    }
  });
}

function creditPurchase(team) {
  return promptOperation({
    text: 'La empresa compra mercaderías por 1.000 € + IVA (21%) a crédito.',
    base: 1000,
    apply: () => {
      team.vatInput += 210;
      team.liabilities += 1210;
      return true;
    }
  });
}

function saleOperation(team) {
  return promptOperation({
    text: 'La empresa vende servicios por 2.000 € + IVA (21%) y cobra por banco.',
    base: 2000,
    apply: () => {
      team.bank += 2420;
      team.vatOutput += 420;
      return true;
    }
  });
}

function loanOperation(team) {
  return promptOperation({
    text: 'La empresa recibe un préstamo bancario de 2.000 €.',
    calcHtml: '<div class="calc">Sin IVA</div>',
    apply: () => {
      team.bank += 2000;
      team.liabilities += 2000;
      team.loans.push({ amount: 2000, turns: 3 });
      return true;
    }
  });
}

function grantOperation(team) {
  return promptOperation({
    text: 'La empresa recibe una subvención de 1.000 €.',
    calcHtml: '<div class="calc">Sin IVA</div>',
    apply: () => {
      team.bank += 1000;
      team.equityBonus += 1000;
      return true;
    }
  });
}

function vatSettlement(team) {
  const result = team.vatOutput - team.vatInput;
  const signText = result >= 0 ? 'a pagar' : 'a devolver';
  return promptOperation({
    text: 'Liquidación de IVA con Hacienda.',
    calcHtml: `<div class="calc">IVA repercutido: ${fmt(team.vatOutput)}<br>IVA soportado: ${fmt(team.vatInput)}<br>Resultado ${signText}: ${fmt(Math.abs(result))}</div>`,
    apply: () => {
      if (result > 0 && !canApplyBank(team, -result, state.allowNegativeBank)) return false;
      team.bank -= result;
      team.vatInput = 0;
      team.vatOutput = 0;
      return true;
    }
  });
}

function questionOperation(team) {
  return new Promise((resolve) => {
    showOperationModal({
      text: 'Pregunta del profesor',
      calcHtml: '<div class="calc">Selecciona resultado de la respuesta.</div>',
      extraButtons: [{ label: `Correcto (+${state.questionReward}€)` }, { label: `Incorrecto (-${state.questionReward}€)` }]
    }, {
      confirm: () => {},
      reject: () => { closeOperationModal(); resolve(); },
      extra: (idx) => {
        const delta = idx === 0 ? state.questionReward : -state.questionReward;
        if (!canApplyBank(team, delta, state.allowNegativeBank)) return alert('Banco insuficiente.');
        team.bank += delta;
        closeOperationModal();
        resolve();
      }
    });
  });
}

function ownStreetOperation(team, cell, idx) {
  const prop = team.properties[idx];
  const reformBase = Math.round(cell.base * 0.3);
  const pairIndices = board.map((c, i) => c.type === 'street' && c.group === cell.group ? i : -1).filter((x) => x >= 0);
  const hasPair = pairIndices.every((i) => team.properties[i]);
  const canFuse = hasPair && !pairIndices.some((i) => team.properties[i].fused);

  return new Promise((resolve) => {
    showOperationModal({
      text: `La empresa realiza una mejora en ${cell.name} por el 30% del valor base + IVA.`,
      base: reformBase,
      extraButtons: canFuse ? [{ label: 'Fusionar propiedades del grupo (coste 1.000 € sin IVA)' }] : []
    }, {
      confirm: () => {
        const { base, vat, total } = amounts(reformBase);
        if (prop.level >= 2) return alert('Nivel máximo de reforma alcanzado.');
        if (!canApplyBank(team, -total, state.allowNegativeBank)) return alert('Banco insuficiente.');
        team.bank -= total;
        team.propertiesValue += base;
        team.vatInput += vat;
        prop.level += 1;
        prop.base += base;
        closeOperationModal();
        resolve();
      },
      reject: () => { closeOperationModal(); resolve(); },
      extra: () => {
        if (!canApplyBank(team, -1000, state.allowNegativeBank)) return alert('Banco insuficiente para fusión.');
        const combined = pairIndices.reduce((sum, i) => sum + team.properties[i].base, 0);
        pairIndices.forEach((i) => {
          team.properties[i].fused = true;
          team.properties[i].combinedValue = combined;
        });
        team.bank -= 1000;
        closeOperationModal();
        resolve();
      }
    });
  });
}

function promptOperation(config) {
  return new Promise((resolve) => {
    showOperationModal(config, {
      confirm: () => {
        const ok = config.apply();
        if (!ok) return alert('Banco insuficiente (operación bloqueada por configuración).');
        closeOperationModal();
        resolve();
      },
      reject: () => {
        closeOperationModal();
        resolve();
      }
    });
  });
}

function persistAndRender() {
  saveState(state);
  renderAll();
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
function fmt(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); }
