import ExcelJS from 'exceljs';
import type { StoreOrder } from './commerce-orders';

export async function orderWorkbook(orders: StoreOrder[], day: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Outouf';
  const summary = workbook.addWorksheet('Orders');
  const items = workbook.addWorksheet('Items');
  const addressColumns = ['Recipient', 'Email', 'Phone', 'Address', 'Address line 2', 'Postal code', 'City', 'Region', 'Country'];
  summary.addRow(['Order ID', 'Paid at (Copenhagen)', 'Status', 'Currency', 'Subtotal', 'Shipping', 'Amount paid', 'Payment reference', ...addressColumns]);
  items.addRow(['Order ID', 'Product ID', 'Product', 'Brand', 'Product link', 'Size / Volume', 'Quantity', 'Unit price DKK', 'Line total DKK', ...addressColumns]);
  for (const order of orders) {
    const d = order.delivery;
    const address = [d?.name, order.email, order.phone, d?.line1, d?.line2, d?.postalCode, d?.city, d?.state, d?.country].map(v => v || '');
    summary.addRow([order.id, new Date(order.paidAt!).toLocaleString('en-GB', { timeZone: 'Europe/Copenhagen' }), order.status, order.currency, order.subtotal / 100, order.shipping / 100, order.total / 100, order.paymentId || '', ...address]);
    for (const line of order.items) items.addRow([order.id, line.productId, line.title, line.brand, { text: 'Open product', hyperlink: line.productUrl }, line.size, line.quantity, line.unitAmount / 100, line.unitAmount * line.quantity / 100, ...address]);
  }
  for (const sheet of [summary, items]) {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: sheet.columnCount } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16334A' } };
    sheet.getRow(1).height = 32;
    sheet.columns.forEach(column => { column.width = 24; column.alignment = { vertical: 'top', wrapText: true }; });
    sheet.getColumn(1).width = 40;
    sheet.headerFooter.oddHeader = `Outouf — ${day} — Europe/Copenhagen`;
  }
  for (const n of [5, 6, 7]) summary.getColumn(n).numFmt = '#,##0.00 "kr."';
  for (const n of [8, 9]) items.getColumn(n).numFmt = '#,##0.00 "kr."';
  items.getColumn(3).width = 42;
  return workbook.xlsx.writeBuffer();
}
