import ExcelJS from 'exceljs';

export type AdminOrderExportFormat = 'json' | 'xlsx' | 'vendor';

export interface AdminOrderRecord {
  orderId?: string;
  userId?: string;
  createdAt?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  shipping?: string;
  trackingNumber?: string;
  notes?: string;
  resellerId?: string;
  source?: string;
  price?: Record<string, unknown>;
  ids?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface VendorExportOptions {
  exportNote?: string;
  resolveAssetUrl?: (objectKey: string) => Promise<string>;
}

interface VendorRow {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  state: string;
  height: string;
  weight: string;
  eyeColor: string;
  hairColor: string;
  gender: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  photoLink: string;
  signatureLink: string;
  customFields: string;
  account: string;
  note: string;
}

const VENDOR_TEMPLATE_PATH = '/templates/idgod-vendor-order-v2.xlsx';
const VENDOR_DATA_START_ROW = 2;

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDateField(row: Record<string, unknown>, kind: 'dob' | 'issue'): string {
  const combined = kind === 'dob' ? row.dob : row.issueDate;
  if (typeof combined === 'string' && combined.trim()) {
    const iso = combined.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
    return combined;
  }
  const month = row[`${kind === 'dob' ? 'dob' : 'issue'}Month`];
  const day = row[`${kind === 'dob' ? 'dob' : 'issue'}Day`];
  const year = row[`${kind === 'dob' ? 'dob' : 'issue'}Year`];
  if (month && day && year) {
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
  }
  return '';
}

function formatHeight(row: Record<string, unknown>): string {
  const ft = row.heightFeet;
  const inch = row.heightInches;
  if (ft && inch !== undefined && inch !== '') return `${ft}'${inch}"`;
  if (ft) return `${ft} ft`;
  return '';
}

function formatGender(sex: unknown): string {
  const value = typeof sex === 'string' ? sex.trim().toLowerCase() : '';
  if (value === 'male' || value === 'm') return 'M';
  if (value === 'female' || value === 'f') return 'F';
  return typeof sex === 'string' ? sex : '';
}

function buildOrderNote(order: AdminOrderRecord, exportNote?: string): string {
  const parts = [order.notes, exportNote].filter(
    (part) => typeof part === 'string' && part.trim()
  ) as string[];
  return parts.join(' | ');
}

function orderAccount(order: AdminOrderRecord): string {
  return String(order.userId ?? order.resellerId ?? '');
}

async function resolveOptionalUrl(
  key: unknown,
  resolveAssetUrl?: (objectKey: string) => Promise<string>
): Promise<string> {
  if (typeof key !== 'string' || !key.trim() || !resolveAssetUrl) return '';
  try {
    return await resolveAssetUrl(key);
  } catch {
    return '';
  }
}

async function orderToVendorRows(
  order: AdminOrderRecord,
  options: VendorExportOptions
): Promise<VendorRow[]> {
  const ids = order.ids ?? [];
  const account = orderAccount(order);
  const note = buildOrderNote(order, options.exportNote);

  return Promise.all(
    ids.map(async (idRow) => ({
      firstName: String(idRow.firstName ?? ''),
      middleName: String(idRow.middleName ?? ''),
      lastName: String(idRow.lastName ?? ''),
      dob: formatDateField(idRow, 'dob'),
      state: String(idRow.state ?? ''),
      height: formatHeight(idRow),
      weight: String(idRow.weight ?? ''),
      eyeColor: String(idRow.eyeColor ?? ''),
      hairColor: String(idRow.hairColor ?? ''),
      gender: formatGender(idRow.sex),
      streetAddress: String(idRow.streetAddress ?? ''),
      city: String(idRow.city ?? ''),
      zipCode: String(idRow.zipCode ?? ''),
      photoLink: await resolveOptionalUrl(idRow.photoKey, options.resolveAssetUrl),
      signatureLink: await resolveOptionalUrl(idRow.signatureKey, options.resolveAssetUrl),
      customFields: formatDateField(idRow, 'issue'),
      account,
      note,
    }))
  );
}

export function exportStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function countExportIdRows(orders: AdminOrderRecord[]): number {
  return orders.reduce((sum, order) => sum + (order.ids?.length ?? 0), 0);
}

export function exportOrdersAsJson(orders: AdminOrderRecord[], filenamePrefix = 'orders'): void {
  const body = JSON.stringify(orders, null, 2);
  const blob = new Blob([body], { type: 'application/json;charset=utf-8' });
  downloadBlob(`${filenamePrefix}-${exportStamp()}.json`, blob);
}

export async function exportOrdersAsSpreadsheet(
  orders: AdminOrderRecord[],
  options: VendorExportOptions = {},
  filenamePrefix = 'orders'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 38 },
    { header: 'Account', key: 'account', width: 24 },
    { header: 'Order Date', key: 'orderDate', width: 22 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Payment', key: 'paymentStatus', width: 12 },
    { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    { header: 'Shipping', key: 'shipping', width: 36 },
    { header: 'Tracking #', key: 'trackingNumber', width: 18 },
    { header: 'Order Note', key: 'orderNote', width: 28 },
    { header: 'Export Note', key: 'exportNote', width: 28 },
    { header: 'State', key: 'state', width: 16 },
    { header: 'First Name', key: 'firstName', width: 16 },
    { header: 'Middle Name', key: 'middleName', width: 16 },
    { header: 'Last Name', key: 'lastName', width: 16 },
    { header: 'DOB', key: 'dob', width: 14 },
    { header: 'Issue Date', key: 'issueDate', width: 14 },
    { header: 'Street', key: 'streetAddress', width: 24 },
    { header: 'City', key: 'city', width: 18 },
    { header: 'ZIP', key: 'zipCode', width: 10 },
    { header: 'ZIP+4', key: 'zipPlus4', width: 8 },
    { header: 'Sex', key: 'sex', width: 8 },
    { header: 'Height', key: 'height', width: 10 },
    { header: 'Weight', key: 'weight', width: 8 },
    { header: 'Eye Color', key: 'eyeColor', width: 12 },
    { header: 'Hair Color', key: 'hairColor', width: 12 },
    { header: 'Photo URL', key: 'photoUrl', width: 48 },
    { header: 'Signature URL', key: 'signatureUrl', width: 48 },
    { header: 'Order Total', key: 'orderTotal', width: 12 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (const order of orders) {
    const ids = order.ids ?? [];
    const account = orderAccount(order);
    const orderNote = typeof order.notes === 'string' ? order.notes : '';
    const exportNote = options.exportNote ?? '';
    const orderTotal =
      order.price && typeof order.price.total === 'number'
        ? order.price.total.toFixed(2)
        : '';

    if (ids.length === 0) {
      sheet.addRow({
        orderId: order.orderId ?? '',
        account,
        orderDate: order.createdAt ?? '',
        status: order.status ?? '',
        paymentStatus: order.paymentStatus ?? '',
        paymentMethod: order.paymentMethod ?? '',
        shipping: order.shipping ?? '',
        trackingNumber: order.trackingNumber ?? '',
        orderNote,
        exportNote,
        orderTotal,
      });
      continue;
    }

    for (const idRow of ids) {
      const photoUrl = await resolveOptionalUrl(idRow.photoKey, options.resolveAssetUrl);
      const signatureUrl = await resolveOptionalUrl(idRow.signatureKey, options.resolveAssetUrl);
      sheet.addRow({
        orderId: order.orderId ?? '',
        account,
        orderDate: order.createdAt ?? '',
        status: order.status ?? '',
        paymentStatus: order.paymentStatus ?? '',
        paymentMethod: order.paymentMethod ?? '',
        shipping: order.shipping ?? '',
        trackingNumber: order.trackingNumber ?? '',
        orderNote,
        exportNote,
        state: idRow.state ?? '',
        firstName: idRow.firstName ?? '',
        middleName: idRow.middleName ?? '',
        lastName: idRow.lastName ?? '',
        dob: formatDateField(idRow, 'dob'),
        issueDate: formatDateField(idRow, 'issue'),
        streetAddress: idRow.streetAddress ?? '',
        city: idRow.city ?? '',
        zipCode: idRow.zipCode ?? '',
        zipPlus4: idRow.zipPlus4 ?? '',
        sex: idRow.sex ?? '',
        height: formatHeight(idRow),
        weight: idRow.weight ?? '',
        eyeColor: idRow.eyeColor ?? '',
        hairColor: idRow.hairColor ?? '',
        photoUrl,
        signatureUrl,
        orderTotal,
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(`${filenamePrefix}-${exportStamp()}.xlsx`, blob);
}

export async function exportOrdersAsVendorTemplate(
  orders: AdminOrderRecord[],
  options: VendorExportOptions = {},
  filenamePrefix = 'idgod-vendor-order'
): Promise<void> {
  const response = await fetch(VENDOR_TEMPLATE_PATH);
  if (!response.ok) {
    throw new Error('Vendor export template is missing.');
  }

  const templateBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Vendor export template is invalid.');
  }

  const vendorRows: VendorRow[] = [];
  for (const order of orders) {
    vendorRows.push(...(await orderToVendorRows(order, options)));
  }

  const maxTemplateRow = sheet.rowCount;
  for (let row = VENDOR_DATA_START_ROW; row <= maxTemplateRow; row += 1) {
    const cells = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];
    for (const col of cells) {
      sheet.getCell(`${col}${row}`).value = null;
    }
  }

  vendorRows.forEach((row, index) => {
    const rowNumber = VENDOR_DATA_START_ROW + index;
    sheet.getCell(`A${rowNumber}`).value = row.firstName;
    sheet.getCell(`B${rowNumber}`).value = row.middleName;
    sheet.getCell(`C${rowNumber}`).value = row.lastName;
    sheet.getCell(`D${rowNumber}`).value = row.dob;
    sheet.getCell(`E${rowNumber}`).value = row.state;
    sheet.getCell(`F${rowNumber}`).value = row.height;
    sheet.getCell(`G${rowNumber}`).value = row.weight;
    sheet.getCell(`H${rowNumber}`).value = row.eyeColor;
    sheet.getCell(`I${rowNumber}`).value = row.hairColor;
    sheet.getCell(`J${rowNumber}`).value = row.gender;
    sheet.getCell(`K${rowNumber}`).value = row.streetAddress;
    sheet.getCell(`L${rowNumber}`).value = row.city;
    sheet.getCell(`M${rowNumber}`).value = row.zipCode;
    sheet.getCell(`N${rowNumber}`).value = row.photoLink;
    sheet.getCell(`O${rowNumber}`).value = row.signatureLink;
    sheet.getCell(`P${rowNumber}`).value = row.customFields;
    sheet.getCell(`Q${rowNumber}`).value = row.account;
    sheet.getCell(`R${rowNumber}`).value = row.note;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(`${filenamePrefix}-${exportStamp()}.xlsx`, blob);
}

export async function runAdminOrderExport(
  format: AdminOrderExportFormat,
  orders: AdminOrderRecord[],
  options: VendorExportOptions = {}
): Promise<void> {
  if (orders.length === 0) return;

  switch (format) {
    case 'json':
      exportOrdersAsJson(orders);
      return;
    case 'xlsx':
      await exportOrdersAsSpreadsheet(orders, options);
      return;
    case 'vendor':
      await exportOrdersAsVendorTemplate(orders, options);
      return;
    default:
      throw new Error('Unsupported export format.');
  }
}
