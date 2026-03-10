-- Delete duplicate agents, keeping the oldest one per (user_id, name)
DELETE FROM agents
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, name ORDER BY created_at ASC) as rn
    FROM agents
  ) ranked
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE agents ADD CONSTRAINT agents_user_id_name_unique UNIQUE (user_id, name);