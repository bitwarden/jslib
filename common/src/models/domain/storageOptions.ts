import { HtmlStorageLocation } from '../../enums/htmlStorageLocation';
import { KeySuffixOptions } from '../../enums/keySuffixOptions';
import { StorageLocation } from '../../enums/storageLocation';

export type StorageOptions = {
    keySuffix?: KeySuffixOptions;
    storageLocation?: StorageLocation;
    useSecureStorage?: boolean;
    userId?: string;
    htmlStorageLocation?: HtmlStorageLocation;
};
