import ExcelJS from "exceljs";
import { IAddress } from "../models/address.model";
import { OrderItem } from "../models/order.model";

export function formatConsigneeAddress(address: IAddress): string {
  return [address.streetAddress, address.address, address.city, address.state]
    .filter((part) => part && part.trim())
    .join(", ");
}

export function formatParcelContents(items: OrderItem[]): string {
  return items
    .map((item: any) => {
      const name = item.product?.name || "Item";
      const weight = item.weight?.trim();
      const alreadyInName =
        weight && name.toLowerCase().includes(weight.toLowerCase());
      return weight && !alreadyInName
        ? `${item.quantity} × ${name} ${weight}`
        : `${item.quantity} × ${name}`;
    })
    .join(", ");
}

export interface ShippingReportRow {
  pickupAddressId: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneePincode: number;
  consigneeMobile: number;
  parcelValue: number;
  parcelContentsDescription: string;
}

const REPORT_HEADERS = [
  "Pickup Address Id",
  "Consignee Name",
  "Consignee Address",
  "Consignee Pincode",
  "Consignee Mobile",
  "Parcel Type",
  "Parcel Value in Rs.",
  "Parcel Contents Description",
];

export async function buildShippingReportWorkbook(
  rows: ShippingReportRow[]
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Shipping Report");

  sheet.addRow(REPORT_HEADERS);

  for (const row of rows) {
    sheet.addRow([
      row.pickupAddressId,
      row.consigneeName,
      row.consigneeAddress,
      row.consigneePincode,
      row.consigneeMobile,
      "Parcel",
      row.parcelValue,
      row.parcelContentsDescription,
    ]);
  }

  return workbook.xlsx.writeBuffer();
}
