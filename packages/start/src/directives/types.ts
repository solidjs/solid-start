export interface NamedImportDefinition {
  kind: "named";
  name: string;
  source: string;
}

export interface DefaultImportDefinition {
  kind: "default";
  source: string;
}

export type ImportDefinition = DefaultImportDefinition | NamedImportDefinition;
