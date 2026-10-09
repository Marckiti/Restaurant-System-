import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateDailySummary, getTableStatus } from './logic.js'

test('getTableStatus marks paid tables as pending until explicit vacate', () => {
  const table = {
    id: 'Mesa 1',
    order: {
      paid: true,
      pendingPayment: false,
      sentToKitchen: false,
      items: [{ qty: 1, unitPrice: 5 }],
    },
  }

  assert.equal(getTableStatus(table), 'pending')
})

test('calculateDailySummary totals cash and transfer sales separately', () => {
  const sales = [
    { total: 20, paymentMethod: 'efectivo', items: [{ qty: 2, unitPrice: 10, category: 'Pescados' }] },
    { total: 15, paymentMethod: 'transferencia', items: [{ qty: 3, unitPrice: 5, category: 'Bebidas' }] },
  ]

  const summary = calculateDailySummary(sales)

  assert.equal(summary.total, 35)
  assert.equal(summary.efectivo, 20)
  assert.equal(summary.transferencia, 15)
})
