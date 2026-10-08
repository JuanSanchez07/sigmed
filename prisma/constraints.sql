-- ============================================================================
-- SigMed - restricciones que Prisma 7 no puede expresar en schema.prisma
-- ============================================================================
-- Estas reglas viven en una migracion propia, separada de la inicial:
--   prisma/migrations/20261004061200_constraints/migration.sql
--
-- Se mantienen aparte a proposito: editar una migracion ya aplicada cambia su
-- checksum y `prisma migrate deploy` deja de funcionar en Vercel.
--
-- Flujo si se vuelve a modificar el schema:
--   1. npx prisma migrate dev --create-only --name <nombre>
--   2. Editar prisma/migrations/<timestamp>_<nombre>/migration.sql
--   3. npx prisma migrate dev
--
-- Para comprobar que la base realmente las hace cumplir: npm run db:verify
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK de dominio
-- ----------------------------------------------------------------------------

-- Stock de un lote nunca puede ser negativo (tarea 3.2.3 del Sprint 1).
ALTER TABLE "vaccine_lot"
  ADD CONSTRAINT "vaccine_lot_quantity_non_negative" CHECK ("quantity_available" >= 0);

-- Un movimiento siempre mueve al menos una dosis (trazabilidad inmutable 3.2 CA2).
ALTER TABLE "stock_movement"
  ADD CONSTRAINT "stock_movement_quantity_positive" CHECK ("quantity" > 0);

-- Una franja horaria siempre tiene fin despues del inicio.
ALTER TABLE "doctor_schedule"
  ADD CONSTRAINT "doctor_schedule_time_range" CHECK ("end_time" > "start_time");

ALTER TABLE "doctor_schedule"
  ADD CONSTRAINT "doctor_schedule_duration_positive" CHECK ("slot_duration_min" > 0);

-- Dia de la semana en formato ISO 8601: 1 = lunes ... 7 = domingo.
ALTER TABLE "doctor_schedule"
  ADD CONSTRAINT "doctor_schedule_weekday_range" CHECK ("weekday" BETWEEN 1 AND 7);

-- El periodo de vigencia no puede cerrar antes de abrir.
ALTER TABLE "doctor_schedule"
  ADD CONSTRAINT "doctor_schedule_validity" CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from");

-- Un turno siempre dura algo.
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_time_range" CHECK ("end_at" > "start_at");

-- Coherencia entre tipo de turno, medico y vacuna.
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_type_consistency" CHECK (
    ("type" = 'VACUNACION' AND "doctor_id" IS NULL AND "vaccine_id" IS NOT NULL)
    OR
    ("type" = 'CONSULTA'   AND "doctor_id" IS NOT NULL AND "vaccine_id" IS NULL)
  );

-- ----------------------------------------------------------------------------
-- 2. Unicas de negocio
-- ----------------------------------------------------------------------------

-- La unica (doctor_id, start_at) del schema alcanza para consultas, pero en
-- Postgres NULL <> NULL, asi que los turnos de vacunacion (sin medico) quedaban
-- sin proteccion. Este indice parcial cubre ese hueco.
CREATE UNIQUE INDEX "appointment_vaccination_slot_unique"
  ON "appointment" ("start_at")
  WHERE "type" = 'VACUNACION';

-- Un paciente no puede tener dos turnos que se pisen en el tiempo, mientras el
-- turno siga en pie (ni cancelado ni bloqueado).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_patient_no_overlap"
  EXCLUDE USING gist (
    "patient_id" WITH =,
    tstzrange("start_at", "end_at") WITH &&
  )
  WHERE ("patient_id" IS NOT NULL AND "status" NOT IN ('CANCELADO', 'BLOQUEADO'));

-- ----------------------------------------------------------------------------
-- 3. Inmutabilidad del libro de movimientos (RF-11, criterio CA2 de US-3.2)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION stock_movement_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'stock_movement es inmutable: no se permite % sobre movimientos de stock', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "stock_movement_no_update"
  BEFORE UPDATE ON "stock_movement"
  FOR EACH ROW EXECUTE FUNCTION stock_movement_immutable();

CREATE TRIGGER "stock_movement_no_delete"
  BEFORE DELETE ON "stock_movement"
  FOR EACH ROW EXECUTE FUNCTION stock_movement_immutable();

-- Nota: el seed usa TRUNCATE (y no DELETE) justamente porque TRUNCATE no
-- dispara los triggers de fila y permite volver a sembrar la base.