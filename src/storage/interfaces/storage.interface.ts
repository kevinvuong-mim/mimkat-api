export interface IStorageService {
  initialize(): Promise<void>;

  upload(file: Buffer, key: string, mimetype: string): Promise<string>;

  delete(key: string): Promise<void>;
}
