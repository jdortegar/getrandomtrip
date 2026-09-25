export interface DraftOperation {
  kind: "list" | "create" | "open" | "reload" | "save" | "delete";
  id?: string;
}
