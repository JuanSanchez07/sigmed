-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PACIENTE', 'MEDICO', 'ENFERMERA', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTA', 'VACUNACION');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('DISPONIBLE', 'RESERVADO', 'CONFIRMADO', 'ATENDIDO', 'AUSENTE', 'CANCELADO', 'BLOQUEADO', 'NO_DISPONIBLE');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('INGRESO', 'EGRESO', 'AJUSTE');

-- CreateTable
CREATE TABLE "user_profile" (
    "id" UUID NOT NULL,
    "clerk_id" TEXT,
    "email" TEXT NOT NULL,
    "dni" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" DATE,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PACIENTE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "license_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedule" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "slot_duration_min" INTEGER NOT NULL DEFAULT 30,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" UUID NOT NULL,
    "patient_id" UUID,
    "doctor_id" UUID,
    "schedule_id" UUID,
    "type" "AppointmentType" NOT NULL DEFAULT 'CONSULTA',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "vaccine_id" UUID,
    "vaccine_lot_id" UUID,
    "notes" TEXT,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "biological_name" TEXT,
    "laboratory" TEXT NOT NULL,
    "critical_stock_level" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_lot" (
    "id" UUID NOT NULL,
    "vaccine_id" UUID NOT NULL,
    "lot_number" TEXT NOT NULL,
    "expires_at" DATE NOT NULL,
    "quantity_available" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" UUID NOT NULL,
    "vaccine_id" UUID NOT NULL,
    "vaccine_lot_id" UUID NOT NULL,
    "movement_type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "actor_id" UUID NOT NULL,
    "appointment_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_record" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment" TEXT,
    "indications" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_clerk_id_key" ON "user_profile"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_email_key" ON "user_profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_dni_key" ON "user_profile"("dni");

-- CreateIndex
CREATE INDEX "user_profile_role_idx" ON "user_profile"("role");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profile_id_key" ON "doctor"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_license_number_key" ON "doctor"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "patient_profile_id_key" ON "patient"("profile_id");

-- CreateIndex
CREATE INDEX "doctor_schedule_doctor_id_idx" ON "doctor_schedule"("doctor_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_schedule_doctor_id_weekday_start_time_valid_from_key" ON "doctor_schedule"("doctor_id", "weekday", "start_time", "valid_from");

-- CreateIndex
CREATE INDEX "appointment_doctor_id_start_at_idx" ON "appointment"("doctor_id", "start_at");

-- CreateIndex
CREATE INDEX "appointment_patient_id_start_at_idx" ON "appointment"("patient_id", "start_at");

-- CreateIndex
CREATE INDEX "appointment_status_start_at_idx" ON "appointment"("status", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_doctor_id_start_at_key" ON "appointment"("doctor_id", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_name_key" ON "vaccine"("name");

-- CreateIndex
CREATE INDEX "vaccine_lot_vaccine_id_expires_at_idx" ON "vaccine_lot"("vaccine_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_lot_vaccine_id_lot_number_key" ON "vaccine_lot"("vaccine_id", "lot_number");

-- CreateIndex
CREATE INDEX "stock_movement_vaccine_lot_id_created_at_idx" ON "stock_movement"("vaccine_lot_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movement_actor_id_idx" ON "stock_movement"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_record_appointment_id_key" ON "clinical_record"("appointment_id");

-- CreateIndex
CREATE INDEX "clinical_record_patient_id_recorded_at_idx" ON "clinical_record"("patient_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "doctor_schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_vaccine_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_vaccine_lot_id_fkey" FOREIGN KEY ("vaccine_lot_id") REFERENCES "vaccine_lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_lot" ADD CONSTRAINT "vaccine_lot_vaccine_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_vaccine_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_vaccine_lot_id_fkey" FOREIGN KEY ("vaccine_lot_id") REFERENCES "vaccine_lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_record" ADD CONSTRAINT "clinical_record_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_record" ADD CONSTRAINT "clinical_record_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_record" ADD CONSTRAINT "clinical_record_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
