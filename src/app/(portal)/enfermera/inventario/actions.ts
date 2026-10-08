"use server";

import { revalidatePath } from "next/cache";
import {
  type FieldErrors,
  hasErrors,
  isUuid,
  requiredDate,
  requiredInt,
  requiredText,
} from "@/lib/forms";
import { StockRuleError, registerStockMovement } from "@/lib/stock";
import { MovementType } from "@/generated/prisma/enums";
import { requireEnfermeraOAdministrador } from "@/lib/actor-guard";

export type MovementFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string>;
};

const ALLOWED_TYPES: MovementType[] = [
  MovementType.INGRESO,
  MovementType.AJUSTE,
];

function rawValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createStockMovement(
  _previous: MovementFormState,
  formData: FormData,
): Promise<MovementFormState> {
  const errors: FieldErrors = {};

  const vaccineId = requiredText(
    formData.get("vaccineId"),
    "vaccineId",
    errors,
    "La vacuna",
  );
  const lotNumber = requiredText(
    formData.get("lotNumber"),
    "lotNumber",
    errors,
    "El lote",
  );
  const reason = rawValue(formData, "reason");

  if (vaccineId && !isUuid(vaccineId)) {
    errors.vaccineId = "La vacuna seleccionada no es valida.";
  }

  const rawType = rawValue(formData, "movementType");
  const movementType = ALLOWED_TYPES.find((type) => type === rawType);

  if (!movementType) {
    errors.movementType = "Selecciona un tipo de movimiento valido.";
  }

  let quantity: number | null = null;

  if (movementType === MovementType.INGRESO) {
    quantity = requiredInt(
      formData.get("quantity"),
      "quantity",
      errors,
      "La cantidad",
      { min: 1 },
    );
  } else if (movementType === MovementType.AJUSTE) {
    quantity = requiredInt(
      formData.get("quantity"),
      "quantity",
      errors,
      "La cantidad",
    );

    if (quantity === 0) {
      errors.quantity = "La cantidad no puede ser 0.";
    }

    requiredText(formData.get("reason"), "reason", errors, "El motivo");
  }

  const expiresAtRaw = rawValue(formData, "expiresAt");
  const expiresAt =
    movementType === MovementType.INGRESO && expiresAtRaw
      ? requiredDate(
          formData.get("expiresAt"),
          "expiresAt",
          errors,
          "La fecha de vencimiento",
        )
      : null;

  const values = {
    vaccineId,
    movementType: rawType,
    lotNumber,
    expiresAt: expiresAtRaw,
    quantity: rawValue(formData, "quantity"),
    reason,
  };

  if (hasErrors(errors) || !movementType || quantity === null) {
    return { errors, values };
  }

  const guard = await requireEnfermeraOAdministrador();

  if ("error" in guard) {
    return { message: guard.error, values };
  }

  try {
    await registerStockMovement({
      vaccineId,
      lotNumber,
      expiresAt,
      quantity,
      movementType,
      reason: reason || null,
      actorId: guard.actor.id,
    });
  } catch (error) {
    if (error instanceof StockRuleError) {
      return { errors: error.fields, values };
    }

    throw error;
  }

  revalidatePath("/enfermera/inventario");

  return {
    message:
      movementType === MovementType.INGRESO
        ? `Se registró un ingreso de ${quantity} unidades.`
        : `Se registró un ajuste de ${quantity} unidades.`,
  };
}