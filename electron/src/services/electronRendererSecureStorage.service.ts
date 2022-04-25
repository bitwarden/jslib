import { ipcRenderer } from "electron";

import { StorageService } from "jslib-common/abstractions/storage.service";
import { StorageOptions } from "jslib-common/models/domain/storageOptions";

export class ElectronRendererSecureStorageService implements StorageService {
  async get<T>(key: string, options?: StorageOptions): Promise<T> {
    const val = await ipcRenderer.invoke("keytar", {
      action: "getPassword",
      key: key,
      keySuffix: options?.keySuffix ?? "",
    });
    return val != null ? (JSON.parse(val) as T) : null;
  }

  async has(key: string, options?: StorageOptions): Promise<boolean> {
    const val = await ipcRenderer.invoke("keytar", {
      action: "hasPassword",
      key: key,
      keySuffix: options?.keySuffix ?? "",
    });
    return !!val;
  }

  async save(key: string, obj: any, options?: StorageOptions): Promise<any> {
    await ipcRenderer.invoke("keytar", {
      action: "setPassword",
      key: key,
      keySuffix: options?.keySuffix ?? "",
      value: JSON.stringify(obj),
    });
  }

  async remove(key: string, options?: StorageOptions): Promise<any> {
    await ipcRenderer.invoke("keytar", {
      action: "deletePassword",
      key: key,
      keySuffix: options?.keySuffix ?? "",
    });
  }
}
