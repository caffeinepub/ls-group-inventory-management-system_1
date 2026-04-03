/* eslint-disable */
// @ts-nocheck
// Updated bindings for JSON-based backend API

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";

export class ExternalBlob {
  _blob?: Uint8Array<ArrayBuffer> | null;
  directURL: string;
  onProgress?: (percentage: number) => void = undefined;
  private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null) {
    if (blob) { this._blob = blob; }
    this.directURL = directURL;
  }
  static fromURL(url: string): ExternalBlob { return new ExternalBlob(url, null); }
  static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
    const url = URL.createObjectURL(new Blob([new Uint8Array(blob)], { type: 'application/octet-stream' }));
    return new ExternalBlob(url, blob);
  }
  public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
    if (this._blob) { return this._blob; }
    const response = await fetch(this.directURL);
    const blob = await response.blob();
    this._blob = new Uint8Array(await blob.arrayBuffer());
    return this._blob;
  }
  public getDirectURL(): string { return this.directURL; }
  public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
    this.onProgress = onProgress;
    return this;
  }
}

export interface backendInterface {
  getAllData(): Promise<[string, string, string, string, string, string, string, string, string, string, string]>;
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
  getOrderLists(): Promise<string>;
  setOrderLists(data: string): Promise<void>;
  getChangeLogOrders(): Promise<string>;
  setChangeLogOrders(data: string): Promise<void>;
}

export class Backend implements backendInterface {
  constructor(
    private actor: ActorSubclass<_SERVICE>,
    private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
    private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
    private processError?: (error: unknown) => never
  ) {}

  private async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.processError) {
      try { return await fn(); } catch (e) { this.processError(e); throw new Error('unreachable'); }
    }
    return fn();
  }

  getAllData() { return this.call(() => this.actor.getAllData()); }
  getInventory() { return this.call(() => this.actor.getInventory()); }
  setInventory(data: string) { return this.call(() => this.actor.setInventory(data)); }
  getBardana() { return this.call(() => this.actor.getBardana()); }
  setBardana(data: string) { return this.call(() => this.actor.setBardana(data)); }
  getOrders() { return this.call(() => this.actor.getOrders()); }
  setOrders(data: string) { return this.call(() => this.actor.setOrders(data)); }
  getTools() { return this.call(() => this.actor.getTools()); }
  setTools(data: string) { return this.call(() => this.actor.setTools(data)); }
  getRawMaterials() { return this.call(() => this.actor.getRawMaterials()); }
  setRawMaterials(data: string) { return this.call(() => this.actor.setRawMaterials(data)); }
  getChangeLogInventory() { return this.call(() => this.actor.getChangeLogInventory()); }
  setChangeLogInventory(data: string) { return this.call(() => this.actor.setChangeLogInventory(data)); }
  getChangeLogBardana() { return this.call(() => this.actor.getChangeLogBardana()); }
  setChangeLogBardana(data: string) { return this.call(() => this.actor.setChangeLogBardana(data)); }
  getTransactionLog() { return this.call(() => this.actor.getTransactionLog()); }
  setTransactionLog(data: string) { return this.call(() => this.actor.setTransactionLog(data)); }
  getUsers() { return this.call(() => this.actor.getUsers()); }
  setUsers(data: string) { return this.call(() => this.actor.setUsers(data)); }
  getOrderLists() { return this.call(() => this.actor.getOrderLists()); }
  setOrderLists(data: string) { return this.call(() => this.actor.setOrderLists(data)); }
  getChangeLogOrders() { return this.call(() => this.actor.getChangeLogOrders()); }
  setChangeLogOrders(data: string) { return this.call(() => this.actor.setChangeLogOrders(data)); }
}

export interface CreateActorOptions {
  agent?: Agent;
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
  processError?: (error: unknown) => never;
}

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>,
  options: CreateActorOptions = {}
): Backend {
  const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
  if (options.agent && options.agentOptions) {
    console.warn('Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.');
  }
  const actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId: canisterId,
    ...options.actorOptions,
  });
  return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
