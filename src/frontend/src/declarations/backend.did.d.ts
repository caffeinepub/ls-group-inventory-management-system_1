// @ts-nocheck
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

export interface _SERVICE {
  getAllData: ActorMethod<[], [string, string, string, string, string, string, string, string, string, string]>;
  getInventory: ActorMethod<[], string>;
  setInventory: ActorMethod<[string], undefined>;
  getBardana: ActorMethod<[], string>;
  setBardana: ActorMethod<[string], undefined>;
  getOrders: ActorMethod<[], string>;
  setOrders: ActorMethod<[string], undefined>;
  getTools: ActorMethod<[], string>;
  setTools: ActorMethod<[string], undefined>;
  getRawMaterials: ActorMethod<[], string>;
  setRawMaterials: ActorMethod<[string], undefined>;
  getChangeLogInventory: ActorMethod<[], string>;
  setChangeLogInventory: ActorMethod<[string], undefined>;
  getChangeLogBardana: ActorMethod<[], string>;
  setChangeLogBardana: ActorMethod<[string], undefined>;
  getTransactionLog: ActorMethod<[], string>;
  setTransactionLog: ActorMethod<[string], undefined>;
  getUsers: ActorMethod<[], string>;
  setUsers: ActorMethod<[string], undefined>;
  getOrderLists: ActorMethod<[], string>;
  setOrderLists: ActorMethod<[string], undefined>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
