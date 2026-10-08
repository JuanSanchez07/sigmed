-- ============================================================================
-- SigMed - el rol pasa a vivir unicamente en Clerk (publicMetadata.role)
-- ============================================================================
-- Contexto:
--   El rol del usuario deja de estar en la base y queda como metadata de Clerk.
--   La IDENTIDAD sigue en la base: user_profile.clerk_id se mantiene y es el
--   vinculo entre un usuario de Clerk y su perfil, sus fichas de medico o
--   paciente, y su firma en stock_movement.actor_id.
--
--   Consecuencia a tener presente (RF-24): la asignacion de roles deja de ser
--   un write en la base y pasa a ser una operacion del Backend API de Clerk o
--   del Dashboard. La base ya no registra quien asigno cada rol.
--
-- Advertencia de Prisma al inspeccionar:
--   "You are about to drop the column `role` on the `user_profile` table,
--    which still contains 7 non-null values."
--   Es esperado. Se descarta el dato de rol a proposito.
--
-- Orden de las operaciones:
--   1. Se elimina el indice, que depende de la columna.
--   2. Se elimina la columna.
--   3. Se elimina el tipo, que ya no tiene referencias.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Indice sobre la columna que se va a eliminar
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS "user_profile_role_idx";

-- ----------------------------------------------------------------------------
-- 2. Columna del rol
-- ----------------------------------------------------------------------------
ALTER TABLE "user_profile" DROP COLUMN IF EXISTS "role";

-- ----------------------------------------------------------------------------
-- 3. Tipo enum, ya sin referencias
-- ----------------------------------------------------------------------------
DROP TYPE IF EXISTS "Role";
