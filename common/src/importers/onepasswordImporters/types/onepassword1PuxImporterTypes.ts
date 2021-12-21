export type ExportAttributes = {
  version: string;
  description: string;
  createdAt: string;
};

export type AccountAttributes = {
  accountName: string;
  name: string;
  avatar: string;
  email: string;
  uuid: string;
  domain: string;
};

type Account = {
  attrs: AccountAttributes;
};

enum VaultAttributeTypeEnum {
  Personal = "P",
  Everyone = "E",
  UserCreated = "U",
}

type VaultAttributes = {
  uuid: string;
  desc: string;
  avatar: string;
  name: string;
  type: VaultAttributeTypeEnum;
};

interface VaultItem {
  uuid: string;
  favIndex: number;
  createdAt: number;
  updatedAt: number;
  trashed: boolean;
  categoryUuid: string;
  details: ItemDetails;
  notesPlain: string;
  sections: Section[];
  passwordHistory: PasswordHistory[];
  overview: ItemOverview;
}

interface ItemDetails {
  loginFields: LoginField[];
  notesPlain: string;
  sections: Section[];
  passwordHistory: PasswordHistory[];
}

interface LoginField {
  value: string;
  id: string;
  name: string;
  fieldType: string;
  designation: string;
}

interface PasswordHistory {
  value: string;
  time: number;
}

interface Section {
  title: string;
  name: string;
  fields: Field[];
}

interface Field {
  title: string;
  id: string;
  value: Value;
  indexAtSource: number;
  guarded: boolean;
  multiline: boolean;
  dontGenerate: boolean;
  inputTraits: InputTraits;
}

interface InputTraits {
  keyboard: string;
  correction: string;
  capitalization: string;
}

interface Value {
  concealed: string;
}

interface ItemOverview {
  subtitle: string;
  urls: URL[];
  title: string;
  url: string;
  ps: number;
  pbe: number;
  pgrng: boolean;
}

interface URL {
  label: string;
  url: string;
}

type Vault = {
  attrs: VaultAttributes;
  items: VaultItem[];
};

type ExportData = {
  accounts: Account[];
  vaults: Vault[];
  createdAt: string;
};
