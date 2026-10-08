-- Corrige dos mensajes de error que quedaban en ingles o con nombres de columna
-- fisica. La logica de las reglas no cambia: solo el texto que ve el operador.

CREATE OR REPLACE FUNCTION "fn_horario_atencion_reglas"() RETURNS trigger AS $$
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
    RAISE EXCEPTION 'El médico % atiende en % días distintos y el máximo es 2', v_medico, v_dias;
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

CREATE OR REPLACE FUNCTION "fn_turno_reglas"() RETURNS trigger AS $$
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
    RAISE EXCEPTION 'El fin del turno debe ser igual al inicio más la duración de consulta del médico';
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