import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface ToolMachineryView {
    quantity: bigint;
    remarks: string;
    product: string;
}
export interface ProductView {
    name: string;
    quantity: number;
}
export interface ChangeLog {
    quantityChange: bigint;
    user: string;
    timestamp: Time;
    plant: string;
    product: string;
}
export interface InventoryView {
    plant: string;
    products: Array<ProductView>;
}
export interface BardanaView {
    plant: string;
    products: Array<ProductView>;
}
export interface RawMaterialView {
    plant: string;
    products: Array<ProductView>;
}
export interface OrderView {
    id: bigint;
    bags: bigint;
    date: Time;
    rate: number;
    brand: string;
    partyName: string;
    dalalName: string;
    remarks: string;
}
export interface backendInterface {
    addOrder(date: Time, brand: string, bags: bigint, rate: number, partyName: string, dalalName: string, remarks: string): Promise<bigint>;
    addToolMachinery(product: string, quantity: bigint, remarks: string): Promise<void>;
    deleteOrder(orderId: bigint): Promise<void>;
    deleteToolMachinery(index: bigint): Promise<void>;
    getBardana(): Promise<Array<[string, BardanaView]>>;
    getChangeLog(): Promise<Array<[bigint, ChangeLog]>>;
    getInventory(): Promise<Array<[string, InventoryView]>>;
    getOrders(): Promise<Array<[bigint, OrderView]>>;
    getRawMaterials(): Promise<Array<[string, RawMaterialView]>>;
    getSortedProductsByQuantity(products: Array<ProductView>): Promise<Array<ProductView>>;
    getToolsMachinery(): Promise<Array<ToolMachineryView>>;
    setBardanaStock(plant: string, productName: string, quantity: number): Promise<boolean>;
    setRawMaterialStock(plant: string, productName: string, quantity: number): Promise<boolean>;
    setStock(plant: string, productName: string, quantity: number, user: string): Promise<boolean>;
    updateOrder(orderId: bigint, date: Time, bags: bigint, rate: number, partyName: string, dalalName: string, remarks: string): Promise<boolean>;
    updateToolMachinery(index: bigint, quantity: bigint, remarks: string): Promise<boolean>;
}
