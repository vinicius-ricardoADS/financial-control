import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private _storage: Storage | null = null;
  private initialized = false;

  constructor(private storage: Storage) {}

  async init(): Promise<void> {
    if (this.initialized) return;

    const storage = await this.storage.create();
    this._storage = storage;
    this.initialized = true;
  }

  async set(key: string, value: any): Promise<void> {
    await this.init();
    await this._storage?.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    return await this._storage?.get(key);
  }

  async remove(key: string): Promise<void> {
    await this.init();
    await this._storage?.remove(key);
  }

  async keys(): Promise<string[]> {
    await this.init();
    return (await this._storage?.keys()) || [];
  }

  async length(): Promise<number> {
    await this.init();
    return (await this._storage?.length()) || 0;
  }

  async clear(): Promise<void> {
    await this.init();
    await this._storage?.clear();
  }
}
