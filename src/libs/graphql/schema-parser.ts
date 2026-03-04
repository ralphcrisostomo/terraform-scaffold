import { readFileSync } from "node:fs";

export interface ModelInfo {
  name: string;
  fields: { name: string; type: string }[];
}

/** Parse all @model types from schema.graphql */
export function parseModels(
  schemaPath: string,
  excludedModels: string[],
): ModelInfo[] {
  const schema = readFileSync(schemaPath, "utf-8");
  const models: ModelInfo[] = [];

  const typeRegex = /type\s+(\w+)\s+@model\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = typeRegex.exec(schema)) !== null) {
    const name = match[1];
    if (excludedModels.includes(name)) continue;

    const fieldsBlock = match[2];
    const fields = parseFieldsBlock(fieldsBlock);
    models.push({ name, fields });
  }

  return models;
}

/** Extract fields from a type block */
function parseFieldsBlock(block: string): { name: string; type: string }[] {
  const fields: { name: string; type: string }[] = [];
  const lines = block.split("\n");

  for (const line of lines) {
    const trimmed = line.replace(/#.*$/, "").trim();
    if (!trimmed) continue;

    const fieldMatch = trimmed.match(/^(\w+)\s*:\s*(.+)$/);
    if (fieldMatch) {
      fields.push({
        name: fieldMatch[1],
        type: fieldMatch[2].trim(),
      });
    }
  }

  return fields;
}

/** Get fields for a specific model */
export function extractModelFields(
  modelName: string,
  schemaPath: string,
  excludedModels: string[],
): { name: string; type: string }[] {
  const models = parseModels(schemaPath, excludedModels);
  const model = models.find((m) => m.name === modelName);
  return model?.fields ?? [];
}
