import { calcNetWorth } from './gameState.js';

export const VAT = 0.21;

export function amounts(base) {
  const vat = Math.round(base * VAT);
  return { base, vat, total: base + vat };
}

export function canApplyBank(team, delta, allowNegativeBank) {
  if (allowNegativeBank) return true;
  return team.bank + delta >= 0;
}

export function applyStartContribution(team) {
  team.bank += 1000;
  team.equityBonus += 1000;
}

export function applyLoanMaturity(team, alerts) {
  team.loans.forEach((loan) => loan.turns--);
  const due = team.loans.filter((loan) => loan.turns <= 0);
  if (due.length) {
    alerts.push(`⚠️ ${team.name} tiene ${due.length} préstamo(s) vencido(s) registrado(s).`);
    team.loans = team.loans.filter((loan) => loan.turns > 0);
  }
}

export function rentForProperty(prop) {
  if (prop.fused) return Math.round(prop.combinedValue * 0.25);
  const factor = 0.15 + prop.level * 0.06;
  return Math.round(prop.base * factor);
}

export function teamSummary(team) {
  return {
    bank: team.bank,
    propertiesValue: team.propertiesValue,
    liabilities: team.liabilities,
    vatPending: team.vatOutput - team.vatInput,
    netWorth: calcNetWorth(team)
  };
}
