import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject, Observable, from, map } from 'rxjs';
import { StorageKeys } from 'src/enums/storage-keys';
import { LocalStorageProvider } from './storage/local-storage.provider';

// Default time for cache expiration
const DEFAULT_TIME = 5 * 60 * 60 * 1000; // 5 hours

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusProvider {
  private state$ = new BehaviorSubject<boolean>(navigator.onLine);
  private cacheEvent$ = new BehaviorSubject<boolean>(false);
  private timeout: NodeJS.Timeout | null = null;

  constructor(private readonly localStorage: LocalStorageProvider) {
    this.initializeNetworkListener();
    this.handleCacheTimeout();
  }

  private async initializeNetworkListener() {
    const status = await Network.getStatus();
    this.state$.next(status.connected);

    Network.addListener('networkStatusChange', (status) => {
      this.state$.next(status.connected);
    });
  }

  public setCachable(timeout: number = DEFAULT_TIME) {
    this.timeout = setTimeout(() => {
      this.cacheEvent$.next(false);
    }, timeout);

    if (timeout === DEFAULT_TIME && !this.cacheEvent$.value) {
      this.localStorage.setData(
        StorageKeys.CACHE_TTL_TIMEOUT,
        (new Date().getTime() + timeout).toString(),
      );
    }

    this.cacheEvent$.next(true);
  }

  isCachable(): Observable<boolean> {
    return this.cacheEvent$.asObservable();
  }

  isOnline(): Observable<boolean> {
    return this.state$.asObservable();
  }

  instantOnline() {
    return this.state$.value;
  }

  clear() {
    this.cacheEvent$.next(false);

    if (this.timeout) {
      clearTimeout(this.timeout);

      this.timeout = null;
    }
  }

  private handleCacheTimeout() {
    const now = new Date().getTime();
    from(this.localStorage.getData(StorageKeys.CACHE_TTL_TIMEOUT))
      .pipe(map((timestamp) => Number(timestamp)))
      .subscribe({
        next: (timestamp) => {
          timestamp && timestamp > now
            ? this.setCachable(timestamp - now)
            : this.localStorage.remove(StorageKeys.CACHE_TTL_TIMEOUT);
        },
      });
  }
}
