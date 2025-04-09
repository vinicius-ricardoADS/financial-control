import { Drivers, Storage } from '@ionic/storage';
import { BehaviorSubject } from 'rxjs';

enum ConnectionState {
  StandBy = 'stand-by',
  Connecting = 'connecting',
  Connected = 'connected',
}

type BaseStorageHandlerOptions = {
  /**
   * Version control number. **default is 1**
   */
  version?: number;
  /**
   * You can have multiple stores inside the same db. _It acts like tables_
   */
  storeName?: string;
};

/**
 * Make sure to call the `init` method in every implementation you do
 * to guarantee the db is created. If the db is already created and working, it will be **blazingly fast**
 */
export class BaseStorageHandler {
  protected db: Storage;

  private readonly storage: Storage;
  private readonly connectionState = new BehaviorSubject(
    ConnectionState.StandBy,
  );

  /**
   * @param name It's the name of the database, be sure to be unique. If not it'll override other databases
   * @param [options={}] some options about the database
   */
  constructor(name: string, options: BaseStorageHandlerOptions = {}) {
    this.storage = new Storage({
      name: name,
      version: options?.version ?? 1,
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage],
      storeName: options?.storeName,
    });

    this.init();
  }

  protected async init() {
    if (this.connectionState.value === ConnectionState.Connecting) {
      await new Promise<void>((r) => {
        this.connectionState.subscribe({
          next: (state) => {
            if (state === ConnectionState.Connected) {
              r();
            }
          },
        });
      });

      return;
    }

    if (this.connectionState.value === ConnectionState.StandBy) {
      this.connectionState.next(ConnectionState.Connecting);

      try {
        this.db = await this.storage.create();
      } finally {
        this.connectionState.next(ConnectionState.Connected);
      }
    }
  }

  public async setData<T>(key: string, value: T) {
    await this.init();

    this.db.set(key, value);
  }

  public async getData<T>(key: string): Promise<T> {
    await this.init();

    return await this.db.get(key);
  }

  public async remove(key: string) {
    await this.init();

    await this.db.remove(key);
  }

  public async keys() {
    await this.init();

    return await this.db.keys();
  }

  public async clear() {
    await this.init();

    await this.db.clear();
  }
}
