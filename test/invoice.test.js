const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// These fixtures model the ticket scenarios with synthetic items.
function assertFigures(order, expectedInvoice, expectedCheckout) {
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...summary } = invoice.computeInvoiceFigures(order);

  assert.deepEqual(summary, expectedInvoice.summary);
  assert.deepEqual(
    rows.map(({ hsn, gstPercent, line, lineTax }) => ({ hsn, gstPercent, line, lineTax })),
    expectedInvoice.rows
  );
  assert.deepEqual(
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      total: checkout.total,
      rates: checkout.lines.map(line => line.gstPercent)
    },
    expectedCheckout
  );
}

test('#1001 invoice uses the 5% and 12% HSN slabs', () => {
  assertFigures({
    id: 1001,
    coupon: '',
    items: [
      { id: 1, name: 'Rice', price: 300, qty: 2, hsn: '1006' },
      { id: 2, name: 'Ghee', price: 400, qty: 1, hsn: '0405' }
    ]
  }, {
    summary: { subtotal: 1000, discount: 0, tax: 78, cgst: 39, sgst: 39, total: 1078 },
    rows: [
      { hsn: '1006', gstPercent: 5, line: 600, lineTax: 30 },
      { hsn: '0405', gstPercent: 12, line: 400, lineTax: 48 }
    ]
  }, { subtotal: 1000, discount: 0, tax: 78, total: 1078, rates: [5, 12] });
});

test('#1002 invoice applies SAVE10 before GST', () => {
  assertFigures({
    id: 1002,
    coupon: 'SAVE10',
    items: [{ id: 1, name: 'Rice', price: 500, qty: 2, hsn: '1006', gstRate: 5 }]
  }, {
    summary: { subtotal: 1000, discount: 100, tax: 45, cgst: 22.5, sgst: 22.5, total: 945 },
    rows: [{ hsn: '1006', gstPercent: 5, line: 1000, lineTax: 45 }]
  }, { subtotal: 1000, discount: 100, tax: 45, total: 945, rates: [5] });
});

test('#1004 invoice applies the SAVE10 cap', () => {
  assertFigures({
    id: 1004,
    coupon: 'SAVE10',
    items: [{ id: 3, name: 'Tea', price: 560, qty: 4, hsn: '0902' }]
  }, {
    summary: { subtotal: 2240, discount: 150, tax: 376.2, cgst: 188.1, sgst: 188.1, total: 2466.2 },
    rows: [{ hsn: '0902', gstPercent: 18, line: 2240, lineTax: 376.2 }]
  }, { subtotal: 2240, discount: 150, tax: 376.2, total: 2466.2, rates: [18] });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% items without a coupon', () => {
  assertFigures({
    id: 1008,
    coupon: '',
    items: [
      { id: 3, name: 'Tea', price: 150, qty: 2, hsn: '0902' },
      { id: 4, name: 'Coffee', price: 200, qty: 1, hsn: '0901', gstRate: 18 }
    ]
  }, {
    summary: { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 },
    rows: [
      { hsn: '0902', gstPercent: 18, line: 300, lineTax: 54 },
      { hsn: '0901', gstPercent: 18, line: 200, lineTax: 36 }
    ]
  }, { subtotal: 500, discount: 0, tax: 90, total: 590, rates: [18, 18] });
});

test('invoice matches checkout for mixed HSN slabs and capped SAVE10', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { id: 1, name: 'Rice', price: 560, qty: 2, hsn: '1006' },
      { id: 2, name: 'Ghee', price: 1120, qty: 1, hsn: '0405' }
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const { rows, ...summary } = invoice.computeInvoiceFigures(order);

  assert.equal(checkout.discount, 150);
  assert.deepEqual(summary, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total
  });
  assert.deepEqual(
    rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax })),
    checkout.lines.map(({ gstPercent, tax }) => ({ gstPercent, lineTax: tax }))
  );
});
