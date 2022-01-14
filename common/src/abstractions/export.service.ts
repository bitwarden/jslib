import { EventView } from "../models/view/eventView";

export abstract class ExportService {
  getExport: (format?: 'csv' | 'json' | 'encrypted_json') => Promise<string>;
  getPasswordProtectedExport: (password: string, format?: 'csv' | 'json' | 'encrypted_json', organizationId?: string) => Promise<string>;
  getOrganizationExport: (organizationId: string, format?: 'csv' | 'json' | 'encrypted_json') => Promise<string>;
  getEventExport: (events: EventView[]) => Promise<string>;
  getFileName: (prefix?: string, extension?: string) => string;
}
