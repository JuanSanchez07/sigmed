-- Refuerza la regla de "unicidad activa" de docs/BD.md: a lo sumo una alerta
-- abierta por vacuna. fn_stock_movimiento_post ya la garantiza con FOR UPDATE
-- sobre la vacuna; este indice parcial la blinda tambien a nivel de esquema.
CREATE UNIQUE INDEX "alerta_stock_activa_unica"
  ON "alerta_stock"("id_vacuna")
  WHERE "estado" = 'activa';