export type FieldErrors = Record<string, string>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function hasErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0;
}

export function requiredText(
  value: FormDataEntryValue | null,
  field: string,
  errors: FieldErrors,
  label: string,
): string {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    errors[field] = `${label} es obligatorio.`;
  }

  return raw;
}

export function requiredInt(
  value: FormDataEntryValue | null,
  field: string,
  errors: FieldErrors,
  label: string,
  bounds: { min?: number; max?: number } = {},
): number | null {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    errors[field] = `${label} es obligatorio.`;
    return null;
  }

  if (!/^-?\d+$/.test(raw)) {
    errors[field] = `${label} debe ser un numero entero.`;
    return null;
  }

  const parsed = Number(raw);

  if (bounds.min !== undefined && parsed < bounds.min) {
    errors[field] = `${label} debe ser mayor o igual a ${bounds.min}.`;
    return null;
  }

  if (bounds.max !== undefined && parsed > bounds.max) {
    errors[field] = `${label} no puede superar ${bounds.max}.`;
    return null;
  }

  return parsed;
}

export function optionalInt(
  value: FormDataEntryValue | null,
  field: string,
  errors: FieldErrors,
  label: string,
  bounds: { min?: number; max?: number } = {},
): number | null {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) return null;

  return requiredInt(raw, field, errors, label, bounds);
}

export function requiredDate(
  value: FormDataEntryValue | null,
  field: string,
  errors: FieldErrors,
  label: string,
): Date | null {
  const raw = requiredText(value, field, errors, label);

  if (!raw) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    errors[field] = `${label} debe tener el formato AAAA-MM-DD.`;
    return null;
  }

  const parsed = new Date(`${raw}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    errors[field] = `${label} no es una fecha valida.`;
    return null;
  }

  if (parsed.toISOString().slice(0, 10) !== raw) {
    errors[field] = `${label} no es una fecha valida.`;
    return null;
  }

  return parsed;
}
