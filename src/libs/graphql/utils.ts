/** Convert camelCase to SCREAMING_SNAKE_CASE */
export function toScreamingSnake(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
}

/** Convert string to PascalCase (capitalize first letter) */
export function toPascal(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Lowercase first character */
export function lcfirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
