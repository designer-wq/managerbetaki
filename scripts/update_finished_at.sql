-- Script para preencher finished_at das demandas existentes
-- Usa a data do log quando a demanda foi mudada para status "Postar"

-- PASSO 1: Primeiro, descubra o ID do status "Postar"
-- Execute: SELECT id, name FROM statuses WHERE name ILIKE '%postar%';
-- Exemplo resultado: bbf65679-a801-4e8f-b91f-6fc0f8e202c7

-- PASSO 2: Atualizar demandas com o ID do status Postar
-- Substitua 'SEU_STATUS_ID_POSTAR_AQUI' pelo ID real

WITH postar_logs AS (
    SELECT DISTINCT ON (l.record_id) 
        l.record_id as demand_id,
        l.created_at as postar_date
    FROM logs l
    WHERE l.table_name = 'demands'
    AND l.action = 'UPDATE'
    AND l.details->>'status_id' = 'bbf65679-a801-4e8f-b91f-6fc0f8e202c7'  -- ID do status Postar
    ORDER BY l.record_id, l.created_at DESC
)
UPDATE demands d
SET finished_at = pl.postar_date
FROM postar_logs pl
WHERE d.id = pl.demand_id
AND d.finished_at IS NULL;

-- Verificar resultado
-- SELECT id, title, finished_at FROM demands WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 20;
