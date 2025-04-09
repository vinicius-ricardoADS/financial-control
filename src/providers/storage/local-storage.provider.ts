import { Injectable } from '@angular/core';
import { BaseStorageHandler } from './base-storage-handler';

/**
 * This provider is inteded to be used to save/get anything related to local storage, like user info, device info, etc.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalStorageProvider extends BaseStorageHandler {
  constructor() {
    super('__dexco', {
      storeName: 'local',
    });
  }
}
