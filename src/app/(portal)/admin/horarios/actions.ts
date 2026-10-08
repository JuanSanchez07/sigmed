'use server';

import { revalidatePath } from 'next/cache';
import { actualizarHorarioMedico, AgendaRuleError } from '@/lib/agenda';
import { getCurrentActor } from '@/lib/dev-actor';

export type HorariosFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export async function modificarHorarios(
  _previousState: HorariosFormState,
  formData: FormData,
): Promise<HorariosFormState> {
  const actor = await getCurrentActor();
  if (!actor || actor.role !== 'ADMINISTRADOR') {
    return {
      status: 'error',
      message: 'No autorizado. Solo un administrador puede modificar los horarios.',
    };
  }

  const doctorId = formData.get('doctorId');
  const dias = formData.getAll('dias');
  const horaInicio = formData.get('horaInicio');
  const horaFin = formData.get('horaFin');
  const duracionStr = formData.get('duracion');

  if (typeof doctorId !== 'string' || !doctorId) {
    return { status: 'error', message: 'Debe seleccionar un profesional válido.' };
  }
  if (!dias.every((dia): dia is string => typeof dia === 'string')) {
    return { status: 'error', message: 'La selección de días no es válida.' };
  }
  if (dias.length === 0) {
    return { status: 'error', message: 'Debe seleccionar al menos un día de atención.' };
  }
  if (new Set(dias).size !== dias.length) {
    return { status: 'error', message: 'No se puede repetir un día de atención.' };
  }
  if (dias.length > 2) {
    return { status: 'error', message: 'Cada profesional puede atender como máximo dos días distintos por semana.' };
  }
  if (typeof horaInicio !== 'string' || typeof horaFin !== 'string' || !horaInicio || !horaFin) {
    return { status: 'error', message: 'Debe especificar la franja horaria completa.' };
  }
  if (horaInicio >= horaFin) {
    return { status: 'error', message: 'La hora de inicio debe ser anterior a la hora de fin.' };
  }
  if (typeof duracionStr !== 'string') {
    return { status: 'error', message: 'Debe seleccionar una duración de turno válida.' };
  }

  const duracion = Number.parseInt(duracionStr, 10);
  if (!Number.isInteger(duracion) || duracion <= 0) {
    return { status: 'error', message: 'Debe seleccionar una duración de turno válida.' };
  }

  try {
    await actualizarHorarioMedico(actor.id, { doctorId, dias, horaInicio, horaFin, duracion });

    revalidatePath('/admin/horarios');
    revalidatePath('/medico/agenda');

    return { status: 'success', message: 'Los horarios se guardaron correctamente.' };
  } catch (error: unknown) {
    console.error('Error detallado de guardado:', error);

    if (error instanceof AgendaRuleError) {
      return { status: 'error', message: error.message };
    }

    return {
      status: 'error',
      message: 'No se pudieron guardar los horarios por un error inesperado. Intenta nuevamente.',
    };
  }
}