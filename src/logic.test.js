import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateDailySummary, calculateFishSummary, getTableStatus } from './logic.js'

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

test('calculateFishSummary accurately calculates fish counts, sizes, cooking methods, and service types', () => {
  const sales = [
    {
      total: 21.25,
      paymentMethod: 'efectivo',
      items: [
        {
          productId: 'pescado-grande',
          name: 'Pescado Grande',
          qty: 2,
          unitPrice: 10.25,
          cooking: 'frito',
          serviceType: 'llevar',
        },
        {
          productId: 'pescado-pequeno',
          name: 'Pescado Pequeño',
          qty: 1,
          unitPrice: 8.0,
          cooking: 'al vapor',
          serviceType: 'servir',
        },
        {
          productId: 'almejas',
          name: 'Almejas',
          qty: 1,
          unitPrice: 5.0,
          cooking: null,
          serviceType: 'servir',
        },
      ],
    },
  ]

  const fishSummary = calculateFishSummary(sales)

  assert.equal(fishSummary.totalUnits, 3)
  assert.equal(fishSummary.grandeUnits, 2)
  assert.equal(fishSummary.pequenoUnits, 1)
  assert.equal(fishSummary.fritoUnits, 2)
  assert.equal(fishSummary.vaporUnits, 1)
  assert.equal(fishSummary.llevarUnits, 2)
  assert.equal(fishSummary.servirUnits, 1)
  assert.equal(fishSummary.totalRevenue, 28.5)
})
