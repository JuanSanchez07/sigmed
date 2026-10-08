-- Reforma de la base al modelo de docs/BD.md (16 entidades).
-- Sustituye el esquema anterior de 9 tablas en snake_case ingles.
--
-- No lleva BEGIN/COMMIT explicitos: el motor de Prisma ya envuelve cada
-- migracion en una transaccion, y un COMMIT interno la cortaria a mitad de
-- camino dejando el esquema a medias.
--
-- El archivo es idempotente: la seccion 0 borra los objetos del modelo
-- anterior y los del propio modelo reformado, asi se puede reejecutar.

-- ============================================================================
-- 0. Limpieza previa (idempotencia)
-- ============================================================================

DROP TABLE IF EXISTS "registro_clinico" CASCADE;
DROP TABLE IF EXISTS "comprobante" CASCADE;
DROP TABLE IF EXISTS "pago" CASCADE;
DROP TABLE IF EXISTS "horario_vacunacion" CASCADE;
DROP TABLE IF EXISTS "alerta_stock" CASCADE;
DROP TABLE IF EXISTS "movimiento_stock" CASCADE;
DROP TABLE IF EXISTS "turno_vacunacion" CASCADE;
DROP TABLE IF EXISTS "lote" CASCADE;
DROP TABLE IF EXISTS "vacuna" CASCADE;
DROP TABLE IF EXISTS "turno" CASCADE;
DROP TABLE IF EXISTS "bloqueo_agenda" CASCADE;
DROP TABLE IF EXISTS "horario_atencion" CASCADE;
DROP TABLE IF EXISTS "medico" CASCADE;
DROP TABLE IF EXISTS "paciente" CASCADE;
DROP TABLE IF EXISTS "obra_social" CASCADE;
DROP TABLE IF EXISTS "usuario" CASCADE;

DROP FUNCTION IF EXISTS "fn_append_only" CASCADE;
DROP FUNCTION IF EXISTS "fn_comprobante_monto_coherente" CASCADE;
DROP FUNCTION IF EXISTS "fn_horario_atencion_reglas" CASCADE;
DROP FUNCTION IF EXISTS "fn_horario_vacunacion_sin_solapamiento" CASCADE;
DROP FUNCTION IF EXISTS "fn_registro_clinico_turno_atendido" CASCADE;
DROP FUNCTION IF EXISTS "fn_stock_movimiento_post" CASCADE;
DROP FUNCTION IF EXISTS "fn_turno_reglas" CASCADE;
DROP FUNCTION IF EXISTS "fn_turno_vacunacion_lote" CASCADE;
DROP FUNCTION IF EXISTS "fn_usuario_rol_inmutable" CASCADE;

DROP TYPE IF EXISTS "tipo_comprobante";
DROP TYPE IF EXISTS "estado_turno_vacunacion";
DROP TYPE IF EXISTS "estado_alerta";
DROP TYPE IF EXISTS "tipo_movimiento";
DROP TYPE IF EXISTS "estado_turno";
DROP TYPE IF EXISTS "motivo_bloqueo";
DROP TYPE IF EXISTS "dia_semana";
DROP TYPE IF EXISTS "especialidad";
DROP TYPE IF EXISTS "estado_cobertura";
DROP TYPE IF EXISTS "rol_usuario";

-- ============================================================================
-- 1. Limpieza del modelo anterior
-- ============================================================================

DROP TRIGGER IF EXISTS "stock_movement_no_update" ON "stock_movement";
DROP TRIGGER IF EXISTS "stock_movement_no_delete" ON "stock_movement";

DROP TABLE IF EXISTS "clinical_record" CASCADE;
DROP TABLE IF EXISTS "stock_movement" CASCADE;
DROP TABLE IF EXISTS "appointment" CASCADE;
DROP TABLE IF EXISTS "vaccine_lot" CASCADE;
DROP TABLE IF EXISTS "vaccine" CASCADE;
DROP TABLE IF EXISTS "doctor_schedule" CASCADE;
DROP TABLE IF EXISTS "patient" CASCADE;
DROP TABLE IF EXISTS "doctor" CASCADE;
DROP TABLE IF EXISTS "user_profile" CASCADE;

DROP TYPE IF EXISTS "AppointmentStatus";
DROP TYPE IF EXISTS "AppointmentType";
DROP TYPE IF EXISTS "MovementType";

-- ============================================================================
-- 2. Enums
-- ============================================================================

CREATE TYPE "rol_usuario" AS ENUM ('paciente', 'medico', 'enfermera', 'administrador');
CREATE TYPE "estado_cobertura" AS ENUM ('pendiente', 'validada', 'rechazada');
CREATE TYPE "especialidad" AS ENUM ('clinico', 'pediatra', 'traumatologo');
CREATE TYPE "dia_semana" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');
CREATE TYPE "motivo_bloqueo" AS ENUM ('licencia', 'feriado', 'imprevisto', 'no_disponible');
CREATE TYPE "estado_turno" AS ENUM ('reservado', 'cancelado', 'atendido', 'ausente');
CREATE TYPE "tipo_movimiento" AS ENUM ('ingreso', 'asignacion_turno', 'devolucion_turno', 'ajuste');
CREATE TYPE "estado_alerta" AS ENUM ('activa', 'resuelta');
CREATE TYPE "estado_turno_vacunacion" AS ENUM ('pendiente', 'aprobado', 'rechazado', 'aplicado', 'cancelado', 'ausente');
CREATE TYPE "tipo_comprobante" AS ENUM ('A', 'B', 'C');

-- ============================================================================
-- 3. Tablas
-- ============================================================================

CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "rol_usuario" NOT NULL,
    "fecha_alta" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clerk_user_id" TEXT NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "obra_social" (
    "id_obra_social" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "aceptada" BOOLEAN NOT NULL,

    CONSTRAINT "obra_social_pkey" PRIMARY KEY ("id_obra_social")
);

CREATE TABLE "paciente" (
    "id_usuario" UUID NOT NULL,
    "id_obra_social" UUID,
    "numero_afiliado" TEXT,
    "plan" TEXT,
    "estado_cobertura" "estado_cobertura",

    CONSTRAINT "paciente_pkey" PRIMARY KEY ("id_usuario"),
    -- el numero de afiliado es obligatorio si hay obra social
    CONSTRAINT "paciente_afiliado_con_obra_social" CHECK (
        "id_obra_social" IS NULL OR ("numero_afiliado" IS NOT NULL AND btrim("numero_afiliado") <> '')
    ),
    -- el estado de cobertura es obligatorio si hay obra social
    CONSTRAINT "paciente_estado_con_obra_social" CHECK (
        "id_obra_social" IS NULL OR "estado_cobertura" IS NOT NULL
    )
);

CREATE TABLE "medico" (
    "id_usuario" UUID NOT NULL,
    "matricula" TEXT NOT NULL,
    "especialidad" "especialidad" NOT NULL,
    "duracion_consulta" INTEGER NOT NULL,
    "valor_consulta" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "medico_pkey" PRIMARY KEY ("id_usuario"),
    CONSTRAINT "medico_duracion_positive" CHECK ("duracion_consulta" > 0),
    CONSTRAINT "medico_valor_consulta_non_negative" CHECK ("valor_consulta" >= 0)
);

CREATE TABLE "horario_atencion" (
    "id_horario" UUID NOT NULL,
    "id_medico" UUID NOT NULL,
    "dia_semana" "dia_semana" NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "id_usuario_modificacion" UUID,
    "fecha_modificacion" TIMESTAMPTZ(3),

    CONSTRAINT "horario_atencion_pkey" PRIMARY KEY ("id_horario"),
    CONSTRAINT "horario_atencion_time_range" CHECK ("hora_fin" > "hora_inicio"),
    -- la auditoria de edicion se escribe de a pares
    CONSTRAINT "horario_atencion_auditoria" CHECK (
        ("id_usuario_modificacion" IS NULL AND "fecha_modificacion" IS NULL)
        OR ("id_usuario_modificacion" IS NOT NULL AND "fecha_modificacion" IS NOT NULL)
    )
);

CREATE TABLE "bloqueo_agenda" (
    "id_bloqueo" UUID NOT NULL,
    "id_medico" UUID NOT NULL,
    "fecha_hora_desde" TIMESTAMPTZ(3) NOT NULL,
    "fecha_hora_hasta" TIMESTAMPTZ(3) NOT NULL,
    "motivo" "motivo_bloqueo" NOT NULL,
    "descripcion" TEXT,
    "id_usuario_registro" UUID NOT NULL,
    "fecha_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueo_agenda_pkey" PRIMARY KEY ("id_bloqueo"),
    CONSTRAINT "bloqueo_agenda_time_range" CHECK ("fecha_hora_hasta" > "fecha_hora_desde")
);

CREATE TABLE "turno" (
    "id_turno" UUID NOT NULL,
    "id_paciente" UUID NOT NULL,
    "id_medico" UUID NOT NULL,
    "fecha_hora_inicio" TIMESTAMPTZ(3) NOT NULL,
    "fecha_hora_fin" TIMESTAMPTZ(3) NOT NULL,
    "estado" "estado_turno" NOT NULL,
    "id_usuario_reserva" UUID NOT NULL,
    "fecha_reserva" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_cancelacion" UUID,
    "motivo_cancelacion" TEXT,
    "fecha_cancelacion" TIMESTAMPTZ(3),
    "fecha_registro_asistencia" TIMESTAMPTZ(3),

    CONSTRAINT "turno_pkey" PRIMARY KEY ("id_turno"),
    CONSTRAINT "turno_time_range" CHECK ("fecha_hora_fin" > "fecha_hora_inicio"),
    -- cancelar exige responsable y timestamp
    CONSTRAINT "turno_cancelacion_completa" CHECK (
        "estado" <> 'cancelado'
        OR ("id_usuario_cancelacion" IS NOT NULL AND "fecha_cancelacion" IS NOT NULL)
    ),
    -- el pase de lista es obligatorio para atendido y ausente
    CONSTRAINT "turno_asistencia_completa" CHECK (
        "estado" NOT IN ('atendido', 'ausente') OR "fecha_registro_asistencia" IS NOT NULL
    )
);

CREATE TABLE "vacuna" (
    "id_vacuna" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel_critico" INTEGER,
    "id_usuario_alta" UUID NOT NULL,
    "fecha_alta" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacuna_pkey" PRIMARY KEY ("id_vacuna"),
    CONSTRAINT "vacuna_nivel_critico_non_negative" CHECK ("nivel_critico" IS NULL OR "nivel_critico" >= 0)
);

CREATE TABLE "lote" (
    "id_lote" UUID NOT NULL,
    "id_vacuna" UUID NOT NULL,
    "numero_lote" TEXT NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "id_usuario_registro" UUID NOT NULL,
    "fecha_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- materializado: lo mantiene el trigger fn_stock_movimiento_post
    "quantity_available" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lote_pkey" PRIMARY KEY ("id_lote"),
    CONSTRAINT "lote_quantity_non_negative" CHECK ("quantity_available" >= 0)
);

CREATE TABLE "turno_vacunacion" (
    "id_turno_vacunacion" UUID NOT NULL,
    "id_paciente" UUID NOT NULL,
    "id_vacuna" UUID NOT NULL,
    "id_lote" UUID,
    "fecha_hora" TIMESTAMPTZ(3) NOT NULL,
    "estado" "estado_turno_vacunacion" NOT NULL,
    "id_usuario_registro" UUID NOT NULL,
    "fecha_solicitud" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_resolucion" UUID,
    "fecha_resolucion" TIMESTAMPTZ(3),
    "motivo_rechazo" TEXT,
    "motivo_cancelacion" TEXT,
    "fecha_cancelacion" TIMESTAMPTZ(3),
    "fecha_aplicacion" TIMESTAMPTZ(3),
    "id_usuario_aplicacion" UUID,

    CONSTRAINT "turno_vacunacion_pkey" PRIMARY KEY ("id_turno_vacunacion"),
    -- mientras este pendiente no hay lote asignado
    CONSTRAINT "turno_vacunacion_lote_requerido" CHECK (
        "estado" = 'pendiente' OR "id_lote" IS NOT NULL
    ),
    CONSTRAINT "turno_vacunacion_resolucion_completa" CHECK (
        "estado" NOT IN ('aprobado', 'rechazado')
        OR ("id_usuario_resolucion" IS NOT NULL AND "fecha_resolucion" IS NOT NULL)
    ),
    CONSTRAINT "turno_vacunacion_rechazo_motivado" CHECK (
        "estado" <> 'rechazado' OR ("motivo_rechazo" IS NOT NULL AND btrim("motivo_rechazo") <> '')
    ),
    CONSTRAINT "turno_vacunacion_cancelacion_completa" CHECK (
        "estado" <> 'cancelado' OR "fecha_cancelacion" IS NOT NULL
    ),
    CONSTRAINT "turno_vacunacion_aplicacion_completa" CHECK (
        "estado" <> 'aplicado' OR ("fecha_aplicacion" IS NOT NULL AND "id_usuario_aplicacion" IS NOT NULL)
    )
);

CREATE TABLE "movimiento_stock" (
    "id_movimiento" UUID NOT NULL,
    "id_lote" UUID NOT NULL,
    "tipo" "tipo_movimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "id_turno_vacunacion" UUID,
    "motivo" TEXT,
    "id_usuario" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_stock_pkey" PRIMARY KEY ("id_movimiento"),
    CONSTRAINT "movimiento_stock_cantidad_distinta_de_cero" CHECK ("cantidad" <> 0),
    -- signo segun el tipo de movimiento
    CONSTRAINT "movimiento_stock_signo_por_tipo" CHECK (
        ("tipo" IN ('ingreso', 'devolucion_turno') AND "cantidad" > 0)
        OR ("tipo" = 'asignacion_turno' AND "cantidad" = -1)
        OR "tipo" = 'ajuste'
    ),
    CONSTRAINT "movimiento_stock_turno_requerido" CHECK (
        "tipo" NOT IN ('asignacion_turno', 'devolucion_turno') OR "id_turno_vacunacion" IS NOT NULL
    ),
    CONSTRAINT "movimiento_stock_ajuste_motivado" CHECK (
        "tipo" <> 'ajuste' OR ("motivo" IS NOT NULL AND btrim("motivo") <> '')
    )
);

CREATE TABLE "alerta_stock" (
    "id_alerta" UUID NOT NULL,
    "id_vacuna" UUID NOT NULL,
    "stock_al_generarse" INTEGER NOT NULL,
    "nivel_critico_al_generarse" INTEGER NOT NULL,
    "estado" "estado_alerta" NOT NULL,
    "fecha_generacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMPTZ(3),

    CONSTRAINT "alerta_stock_pkey" PRIMARY KEY ("id_alerta"),
    CONSTRAINT "alerta_stock_stock_non_negative" CHECK ("stock_al_generarse" >= 0),
    CONSTRAINT "alerta_stock_resolucion_completa" CHECK (
        "estado" <> 'resuelta' OR "fecha_resolucion" IS NOT NULL
    )
);

CREATE TABLE "horario_vacunacion" (
    "id_horario_vacunacion" UUID NOT NULL,
    "dia_semana" "dia_semana" NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_fin" TIME(0) NOT NULL,
    "duracion_turno" INTEGER NOT NULL,
    "id_usuario_registro" UUID NOT NULL,
    "fecha_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horario_vacunacion_pkey" PRIMARY KEY ("id_horario_vacunacion"),
    CONSTRAINT "horario_vacunacion_time_range" CHECK ("hora_fin" > "hora_inicio"),
    CONSTRAINT "horario_vacunacion_duracion_positive" CHECK ("duracion_turno" > 0)
);

CREATE TABLE "pago" (
    "id_pago" UUID NOT NULL,
    "id_turno" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "medio_pago" TEXT NOT NULL,
    "codigo_transaccion" TEXT,
    "id_usuario_registro" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id_pago"),
    CONSTRAINT "pago_monto_positive" CHECK ("monto" > 0)
);

CREATE TABLE "comprobante" (
    "id_comprobante" UUID NOT NULL,
    "id_pago" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "tipo_comprobante" NOT NULL,
    "monto_total" DECIMAL(12,2) NOT NULL,
    "fecha_emision" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivo" TEXT NOT NULL,

    CONSTRAINT "comprobante_pkey" PRIMARY KEY ("id_comprobante")
);

CREATE TABLE "registro_clinico" (
    "id_registro" UUID NOT NULL,
    "id_turno" UUID NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "indicaciones" TEXT,
    "tratamiento" TEXT,
    "fecha_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_clinico_pkey" PRIMARY KEY ("id_registro")
);

-- ============================================================================
-- 4. Indices unicos y de consulta
-- ============================================================================

CREATE UNIQUE INDEX "usuario_dni_key" ON "usuario"("dni");
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");
CREATE UNIQUE INDEX "usuario_clerk_user_id_key" ON "usuario"("clerk_user_id");

CREATE UNIQUE INDEX "obra_social_nombre_key" ON "obra_social"("nombre");

CREATE INDEX "paciente_id_obra_social_idx" ON "paciente"("id_obra_social");

CREATE UNIQUE INDEX "medico_matricula_key" ON "medico"("matricula");
CREATE UNIQUE INDEX "medico_especialidad_key" ON "medico"("especialidad");

CREATE UNIQUE INDEX "horario_atencion_franja_unique" ON "horario_atencion"("id_medico", "dia_semana", "hora_inicio");
CREATE INDEX "horario_atencion_id_medico_idx" ON "horario_atencion"("id_medico");

CREATE INDEX "bloqueo_agenda_id_medico_fecha_hora_desde_idx" ON "bloqueo_agenda"("id_medico", "fecha_hora_desde");

CREATE INDEX "turno_id_medico_fecha_hora_inicio_idx" ON "turno"("id_medico", "fecha_hora_inicio");
CREATE INDEX "turno_id_paciente_fecha_hora_inicio_idx" ON "turno"("id_paciente", "fecha_hora_inicio");
CREATE INDEX "turno_estado_fecha_hora_inicio_idx" ON "turno"("estado", "fecha_hora_inicio");

CREATE UNIQUE INDEX "vacuna_nombre_key" ON "vacuna"("nombre");

CREATE UNIQUE INDEX "lote_numero_unique" ON "lote"("id_vacuna", "numero_lote");
CREATE INDEX "lote_id_vacuna_fecha_vencimiento_idx" ON "lote"("id_vacuna", "fecha_vencimiento");

CREATE UNIQUE INDEX "horario_vacunacion_franja_unique" ON "horario_vacunacion"("dia_semana", "hora_inicio");

CREATE INDEX "turno_vacunacion_id_paciente_fecha_hora_idx" ON "turno_vacunacion"("id_paciente", "fecha_hora");
CREATE INDEX "turno_vacunacion_estado_fecha_hora_idx" ON "turno_vacunacion"("estado", "fecha_hora");

CREATE INDEX "movimiento_stock_id_lote_fecha_hora_idx" ON "movimiento_stock"("id_lote", "fecha_hora");
CREATE INDEX "movimiento_stock_id_usuario_idx" ON "movimiento_stock"("id_usuario");

CREATE INDEX "alerta_stock_id_vacuna_estado_idx" ON "alerta_stock"("id_vacuna", "estado");

CREATE UNIQUE INDEX "pago_id_turno_key" ON "pago"("id_turno");
CREATE UNIQUE INDEX "comprobante_id_pago_key" ON "comprobante"("id_pago");
CREATE UNIQUE INDEX "comprobante_numero_key" ON "comprobante"("numero");
CREATE UNIQUE INDEX "registro_clinico_id_turno_key" ON "registro_clinico"("id_turno");

-- ============================================================================
-- 5. Claves foraneas
-- ============================================================================

ALTER TABLE "paciente" ADD CONSTRAINT "paciente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_id_obra_social_fkey" FOREIGN KEY ("id_obra_social") REFERENCES "obra_social"("id_obra_social") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "medico" ADD CONSTRAINT "medico_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "horario_atencion" ADD CONSTRAINT "horario_atencion_id_medico_fkey" FOREIGN KEY ("id_medico") REFERENCES "medico"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "horario_atencion" ADD CONSTRAINT "horario_atencion_id_usuario_modificacion_fkey" FOREIGN KEY ("id_usuario_modificacion") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bloqueo_agenda" ADD CONSTRAINT "bloqueo_agenda_id_medico_fkey" FOREIGN KEY ("id_medico") REFERENCES "medico"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bloqueo_agenda" ADD CONSTRAINT "bloqueo_agenda_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "turno" ADD CONSTRAINT "turno_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno" ADD CONSTRAINT "turno_id_medico_fkey" FOREIGN KEY ("id_medico") REFERENCES "medico"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno" ADD CONSTRAINT "turno_id_usuario_reserva_fkey" FOREIGN KEY ("id_usuario_reserva") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno" ADD CONSTRAINT "turno_id_usuario_cancelacion_fkey" FOREIGN KEY ("id_usuario_cancelacion") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vacuna" ADD CONSTRAINT "vacuna_id_usuario_alta_fkey" FOREIGN KEY ("id_usuario_alta") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lote" ADD CONSTRAINT "lote_id_vacuna_fkey" FOREIGN KEY ("id_vacuna") REFERENCES "vacuna"("id_vacuna") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lote" ADD CONSTRAINT "lote_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "turno_vacunacion" ADD CONSTRAINT "turno_vacunacion_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno_vacunacion" ADD CONSTRAINT "turno_vacunacion_id_vacuna_fkey" FOREIGN KEY ("id_vacuna") REFERENCES "vacuna"("id_vacuna") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno_vacunacion" ADD CONSTRAINT "turno_vacunacion_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno_vacunacion" ADD CONSTRAINT "turno_vacunacion_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno_vacunacion" ADD CONSTRAINT "turno_vacunacion_id_usuario_resolucion_fkey" FOREIGN KEY ("id_usuario_resolucion") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turno_vacunacion" ADD CONSTRAINT "turno_vacunacion_id_usuario_aplicacion_fkey" FOREIGN KEY ("id_usuario_aplicacion") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_id_turno_vacunacion_fkey" FOREIGN KEY ("id_turno_vacunacion") REFERENCES "turno_vacunacion"("id_turno_vacunacion") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "alerta_stock" ADD CONSTRAINT "alerta_stock_id_vacuna_fkey" FOREIGN KEY ("id_vacuna") REFERENCES "vacuna"("id_vacuna") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "horario_vacunacion" ADD CONSTRAINT "horario_vacunacion_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pago" ADD CONSTRAINT "pago_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pago" ADD CONSTRAINT "pago_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_id_pago_fkey" FOREIGN KEY ("id_pago") REFERENCES "pago"("id_pago") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registro_clinico" ADD CONSTRAINT "registro_clinico_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- 6. Reglas de negocio que el esquema no puede expresar
-- ============================================================================

-- El rol es inmutable tras el alta.
CREATE FUNCTION "fn_usuario_rol_inmutable"() RETURNS trigger AS $$
BEGIN
  IF NEW.rol IS DISTINCT FROM OLD.rol THEN
    RAISE EXCEPTION 'El rol de un usuario es inmutable tras el alta (usuario %)', OLD."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "usuario_rol_inmutable"
BEFORE UPDATE ON "usuario"
FOR EACH ROW EXECUTE FUNCTION "fn_usuario_rol_inmutable"();

-- Maximo dos dias por medico y sin superposicion de franjas.
CREATE FUNCTION "fn_horario_atencion_reglas"() RETURNS trigger AS $$
DECLARE
  v_medico UUID := COALESCE(NEW."id_medico", OLD."id_medico");
  v_dias INTEGER;
  v_chocan INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD."id_medico" IS DISTINCT FROM NEW."id_medico" THEN
    RAISE EXCEPTION 'No se puede mover una franja de horario entre médicos';
  END IF;

  -- serializa las altas concurrentes del mismo medico
  PERFORM 1 FROM "medico" WHERE "id_usuario" = v_medico FOR UPDATE;

  SELECT count(DISTINCT "dia_semana") INTO v_dias
  FROM "horario_atencion" WHERE "id_medico" = v_medico;

  IF v_dias > 2 THEN
    RAISE EXCEPTION 'El medico % attends en % días distintos y el máximo es 2', v_medico, v_dias;
  END IF;

  SELECT count(*) INTO v_chocan
  FROM "horario_atencion"
  WHERE "id_medico" = v_medico
    AND "dia_semana" = NEW."dia_semana"
    AND "hora_inicio" < NEW."hora_fin"
    AND NEW."hora_inicio" < "hora_fin"
    AND (TG_OP = 'INSERT' OR "id_horario" <> NEW."id_horario");

  IF v_chocan > 0 THEN
    RAISE EXCEPTION 'La franja se superpone con otra ya cargada para el médico %', v_medico;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "horario_atencion_reglas"
BEFORE INSERT OR UPDATE ON "horario_atencion"
FOR EACH ROW EXECUTE FUNCTION "fn_horario_atencion_reglas"();

-- Sin retroactividad, fin coherente con la duracion del medico, sin turnos
-- concurrentes, motivo obligatorio segun rol y estados terminales.
CREATE FUNCTION "fn_turno_reglas"() RETURNS trigger AS $$
DECLARE
  v_duracion INTEGER;
  v_rol "rol_usuario";
  v_chocan INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD."estado" <> 'reservado' AND NEW."estado" <> OLD."estado" THEN
      RAISE EXCEPTION 'El estado % es terminal: el turno % no puede pasar a %', OLD."estado", OLD."id_turno", NEW."estado";
    END IF;

    IF NEW."id_medico" <> OLD."id_medico"
       OR NEW."id_paciente" <> OLD."id_paciente"
       OR NEW."fecha_hora_inicio" <> OLD."fecha_hora_inicio" THEN
      RAISE EXCEPTION 'No se puede reasignar ni mover un turno existente';
    END IF;
  ELSE
    IF NEW."fecha_hora_inicio" < now() THEN
      RAISE EXCEPTION 'No se admiten reservas en fecha u hora previa a la actual';
    END IF;
  END IF;

  SELECT "duracion_consulta" INTO v_duracion FROM "medico" WHERE "id_usuario" = NEW."id_medico";

  IF v_duracion IS NULL THEN
    RAISE EXCEPTION 'El médico % no existe', NEW."id_medico";
  END IF;

  IF NEW."fecha_hora_fin" <> NEW."fecha_hora_inicio" + make_interval(mins => v_duracion) THEN
    RAISE EXCEPTION 'fecha_hora_fin debe ser igual a fecha_hora_inicio mas la duracion_consulta del médico';
  END IF;

  -- serializa las reservas concurrentes del mismo medico
  PERFORM 1 FROM "medico" WHERE "id_usuario" = NEW."id_medico" FOR UPDATE;

  SELECT count(*) INTO v_chocan
  FROM "turno"
  WHERE "id_medico" = NEW."id_medico"
    AND "estado" IN ('reservado', 'atendido')
    AND "fecha_hora_inicio" < NEW."fecha_hora_fin"
    AND NEW."fecha_hora_inicio" < "fecha_hora_fin"
    AND (TG_OP = 'INSERT' OR "id_turno" <> NEW."id_turno");

  IF v_chocan > 0 THEN
    RAISE EXCEPTION 'El médico % ya tiene un turno activo en ese intervalo', NEW."id_medico";
  END IF;

  IF NEW."estado" = 'cancelado' AND NEW."id_usuario_cancelacion" IS NOT NULL THEN
    SELECT "rol" INTO v_rol FROM "usuario" WHERE "id" = NEW."id_usuario_cancelacion";
    IF v_rol::text IN ('medico', 'administrador')
       AND (NEW."motivo_cancelacion" IS NULL OR btrim(NEW."motivo_cancelacion") = '') THEN
      RAISE EXCEPTION 'El rol % debe indicar el motivo de la cancelación', v_rol;
    END IF;
  END IF;

  IF NEW."fecha_registro_asistencia" IS NOT NULL
     AND NEW."fecha_registro_asistencia"::date < NEW."fecha_hora_inicio"::date THEN
    RAISE EXCEPTION 'El pase de lista no puede ser anterior al día de la cita';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "turno_reglas"
BEFORE INSERT OR UPDATE ON "turno"
FOR EACH ROW EXECUTE FUNCTION "fn_turno_reglas"();

-- Recalcula el stock materializado del lote y dispara o resuelve la alerta.
-- Un solo trigger porque Postgres los ejecuta en orden alfabetico y la alerta
-- necesita leer el stock ya recalculado.
CREATE FUNCTION "fn_stock_movimiento_post"() RETURNS trigger AS $$
DECLARE
  v_total INTEGER;
  v_vacuna UUID;
  v_critico INTEGER;
  v_stock INTEGER;
BEGIN
  -- serializa los movimientos concurrentes del mismo lote
  PERFORM 1 FROM "lote" WHERE "id_lote" = NEW."id_lote" FOR UPDATE;

  SELECT COALESCE(sum("cantidad"), 0)::INTEGER INTO v_total
  FROM "movimiento_stock" WHERE "id_lote" = NEW."id_lote";

  IF v_total < 0 THEN
    RAISE EXCEPTION 'El movimiento dejaría el lote % en stock negativo (resultante %)',
      NEW."id_lote", v_total;
  END IF;

  UPDATE "lote" SET "quantity_available" = v_total WHERE "id_lote" = NEW."id_lote";

  SELECT "id_vacuna" INTO v_vacuna FROM "lote" WHERE "id_lote" = NEW."id_lote";
  SELECT "nivel_critico" INTO v_critico FROM "vacuna" WHERE "id_vacuna" = v_vacuna;

  IF v_critico IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM 1 FROM "vacuna" WHERE "id_vacuna" = v_vacuna FOR UPDATE;

  -- stock de la vacuna: solo lotes no vencidos (seccion 0.1)
  SELECT COALESCE(sum("quantity_available"), 0)::INTEGER INTO v_stock
  FROM "lote"
  WHERE "id_vacuna" = v_vacuna AND "fecha_vencimiento" >= CURRENT_DATE;

  IF v_stock <= v_critico THEN
    IF NOT EXISTS (
      SELECT 1 FROM "alerta_stock" WHERE "id_vacuna" = v_vacuna AND "estado" = 'activa'
    ) THEN
      INSERT INTO "alerta_stock"
        ("id_alerta", "id_vacuna", "stock_al_generarse", "nivel_critico_al_generarse", "estado", "fecha_generacion")
      VALUES (gen_random_uuid(), v_vacuna, v_stock, v_critico, 'activa', now());
    END IF;
  ELSE
    UPDATE "alerta_stock"
    SET "estado" = 'resuelta', "fecha_resolucion" = now()
    WHERE "id_vacuna" = v_vacuna AND "estado" = 'activa';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "stock_movimiento_post"
AFTER INSERT ON "movimiento_stock"
FOR EACH ROW EXECUTE FUNCTION "fn_stock_movimiento_post"();

-- Tablas append-only: movimiento_stock y registro_clinico.
CREATE FUNCTION "fn_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es append-only: la operación % no está permitida (Ley 26.529)',
    TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "movimiento_stock_no_update" BEFORE UPDATE ON "movimiento_stock"
FOR EACH ROW EXECUTE FUNCTION "fn_append_only"();
CREATE TRIGGER "movimiento_stock_no_delete" BEFORE DELETE ON "movimiento_stock"
FOR EACH ROW EXECUTE FUNCTION "fn_append_only"();
CREATE TRIGGER "registro_clinico_no_update" BEFORE UPDATE ON "registro_clinico"
FOR EACH ROW EXECUTE FUNCTION "fn_append_only"();
CREATE TRIGGER "registro_clinico_no_delete" BEFORE DELETE ON "registro_clinico"
FOR EACH ROW EXECUTE FUNCTION "fn_append_only"();

-- El lote asignado debe pertenecer a la vacuna y no estar vencido.
CREATE FUNCTION "fn_turno_vacunacion_lote"() RETURNS trigger AS $$
DECLARE
  v_vacuna UUID;
  v_vencimiento DATE;
BEGIN
  IF NEW."id_lote" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "id_vacuna", "fecha_vencimiento" INTO v_vacuna, v_vencimiento
  FROM "lote" WHERE "id_lote" = NEW."id_lote";

  IF v_vacuna IS DISTINCT FROM NEW."id_vacuna" THEN
    RAISE EXCEPTION 'El lote % no corresponde a la vacuna %', NEW."id_lote", NEW."id_vacuna";
  END IF;

  IF v_vencimiento < CURRENT_DATE THEN
    RAISE EXCEPTION 'El lote % está vencido y no puede asignarse', NEW."id_lote";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "turno_vacunacion_lote"
BEFORE INSERT OR UPDATE ON "turno_vacunacion"
FOR EACH ROW EXECUTE FUNCTION "fn_turno_vacunacion_lote"();

-- Las franjas de vacunatorio no se superponen en un mismo dia.
CREATE FUNCTION "fn_horario_vacunacion_sin_solapamiento"() RETURNS trigger AS $$
DECLARE
  v_chocan INTEGER;
BEGIN
  SELECT count(*) INTO v_chocan
  FROM "horario_vacunacion"
  WHERE "dia_semana" = NEW."dia_semana"
    AND "hora_inicio" < NEW."hora_fin"
    AND NEW."hora_inicio" < "hora_fin"
    AND (TG_OP = 'INSERT' OR "id_horario_vacunacion" <> NEW."id_horario_vacunacion");

  IF v_chocan > 0 THEN
    RAISE EXCEPTION 'La franja de vacunación se superpone con otra del mismo día';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "horario_vacunacion_sin_solapamiento"
BEFORE INSERT OR UPDATE ON "horario_vacunacion"
FOR EACH ROW EXECUTE FUNCTION "fn_horario_vacunacion_sin_solapamiento"();

-- El comprobante factura exactamente lo que se cobro.
CREATE FUNCTION "fn_comprobante_monto_coherente"() RETURNS trigger AS $$
DECLARE
  v_monto NUMERIC(12,2);
BEGIN
  SELECT "monto" INTO v_monto FROM "pago" WHERE "id_pago" = NEW."id_pago";

  IF v_monto IS NULL THEN
    RAISE EXCEPTION 'El pago % no existe', NEW."id_pago";
  END IF;

  IF NEW."monto_total" <> v_monto THEN
    RAISE EXCEPTION 'El monto total (%) debe ser idéntico al monto del pago (%)', NEW."monto_total", v_monto;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "comprobante_monto_coherente"
BEFORE INSERT OR UPDATE ON "comprobante"
FOR EACH ROW EXECUTE FUNCTION "fn_comprobante_monto_coherente"();

-- El registro clinico se asienta solo sobre turnos atendidos.
CREATE FUNCTION "fn_registro_clinico_turno_atendido"() RETURNS trigger AS $$
DECLARE
  v_estado "estado_turno";
BEGIN
  SELECT "estado" INTO v_estado FROM "turno" WHERE "id_turno" = NEW."id_turno";

  IF v_estado IS DISTINCT FROM 'atendido' THEN
    RAISE EXCEPTION 'Solo se puede asentar un registro clínico sobre un turno atendido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "registro_clinico_turno_atendido"
BEFORE INSERT ON "registro_clinico"
FOR EACH ROW EXECUTE FUNCTION "fn_registro_clinico_turno_atendido"();