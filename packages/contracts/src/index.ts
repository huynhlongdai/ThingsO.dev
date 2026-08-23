export type SourceKind = "source_fact" | "ai_inference" | "editorial";

export interface ProvenancedValue<T> {
  value: T;
  sourceKind: SourceKind;
  confidence?: number;
  sourceIds?: string[];
}
