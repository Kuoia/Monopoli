import { amounts } from './financeEngine.js';

export function showOperationModal(payload, handlers) {
  const modal = document.getElementById('operation-modal');
  const root = document.getElementById('operation-content');

  const calc = payload.base !== undefined
    ? (() => {
        const { base, vat, total } = amounts(payload.base);
        return `<div class="calc">Base: ${fmt(base)}<br>IVA (21%): ${fmt(vat)}<br>Total: ${fmt(total)}</div>`;
      })()
    : payload.calcHtml || '';

  root.innerHTML = `
    <div class="modal-wrap">
      <div class="op-top">${payload.text}</div>
      ${calc}
      <div class="t-account">
        <div class="left"><strong>DEBE</strong><div class="placeholder">(vacío)</div></div>
        <div><strong>HABER</strong><div class="placeholder">(vacío)</div></div>
      </div>
      ${payload.warning ? `<p class="warn">${payload.warning}</p>` : ''}
      <div class="actions">
        ${(payload.extraButtons || []).map((b, idx) => `<button data-extra="${idx}">${b.label}</button>`).join('')}
        <button id="btn-confirm">Confirmar asiento correcto</button>
        <button id="btn-reject">Rechazar</button>
      </div>
    </div>`;

  root.querySelector('#btn-confirm').onclick = () => handlers.confirm();
  root.querySelector('#btn-reject').onclick = () => handlers.reject();
  root.querySelectorAll('[data-extra]').forEach((b) => {
    b.onclick = () => handlers.extra?.(Number(b.dataset.extra));
  });

  modal.showModal();
}

export function closeOperationModal() {
  document.getElementById('operation-modal').close();
}

function fmt(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
