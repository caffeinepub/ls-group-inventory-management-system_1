import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    getInventory(): Promise<string>;
    setInventory(data: string): Promise<void>;
    getBardana(): Promise<string>;
    setBardana(data: string): Promise<void>;
    getOrders(): Promise<string>;
    setOrders(data: string): Promise<void>;
    getTools(): Promise<string>;
    setTools(data: string): Promise<void>;
    getRawMaterials(): Promise<string>;
    setRawMaterials(data: string): Promise<void>;
    getChangeLogInventory(): Promise<string>;
    setChangeLogInventory(data: string): Promise<void>;
    getChangeLogBardana(): Promise<string>;
    setChangeLogBardana(data: string): Promise<void>;
    getTransactionLog(): Promise<string>;
    setTransactionLog(data: string): Promise<void>;
    getUsers(): Promise<string>;
    setUsers(data: string): Promise<void>;
    getAllData(): Promise<[string, string, string, string, string, string, string, string, string]>;
}
