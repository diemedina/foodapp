-- Ejecutar con la versión anterior fuera de servicio, antes de publicar la nueva.
BEGIN;

LOCK TABLE week_plans, plan_slots, shopping_checks, template_slots IN ACCESS EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS foodapp_data_migrations (
  name text PRIMARY KEY
);

DO $migration$
BEGIN
  INSERT INTO foodapp_data_migrations (name) VALUES ('saturday-weeks')
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Guardar las fechas reales antes de cambiar el inicio de cada semana.
  CREATE TEMP TABLE old_slots ON COMMIT DROP AS
  SELECT slot.id, slot.meal, slot.recipe_id, slot.is_leftover,
         week.week_start + slot.day AS meal_date
  FROM plan_slots AS slot
  JOIN week_plans AS week ON week.id = slot.week_plan_id
  WHERE EXTRACT(ISODOW FROM week.week_start) = 1;

  DELETE FROM plan_slots WHERE id IN (SELECT id FROM old_slots);

  -- Mantener los IDs de las semanas para conservar sus marcas de compras.
  UPDATE week_plans SET week_start = week_start - 2
  WHERE EXTRACT(ISODOW FROM week_start) = 1;

  INSERT INTO week_plans (week_start)
  SELECT DISTINCT meal_date - ((EXTRACT(DOW FROM meal_date)::int + 1) % 7)
  FROM old_slots
  ON CONFLICT (week_start) DO NOTHING;

  INSERT INTO plan_slots (id, week_plan_id, day, meal, recipe_id, is_leftover)
  SELECT slot.id, week.id, slot.meal_date - week.week_start, slot.meal,
         slot.recipe_id, slot.is_leftover
  FROM old_slots AS slot
  JOIN week_plans AS week
    ON week.week_start = slot.meal_date - ((EXTRACT(DOW FROM slot.meal_date)::int + 1) % 7);

  CREATE TEMP TABLE old_template_slots ON COMMIT DROP AS
  SELECT template_id, (day + 2) % 7 AS day, meal, recipe_id, is_leftover
  FROM template_slots;

  DELETE FROM template_slots;
  INSERT INTO template_slots (template_id, day, meal, recipe_id, is_leftover)
  SELECT template_id, day, meal, recipe_id, is_leftover FROM old_template_slots;
END;
$migration$;

COMMIT;
