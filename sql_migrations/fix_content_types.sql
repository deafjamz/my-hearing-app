-- STEP 1: First, see what content_type values currently exist
SELECT DISTINCT content_type, COUNT(*) as count
FROM stimuli_catalog
GROUP BY content_type;

-- STEP 2: Drop the constraint entirely (no check)
ALTER TABLE stimuli_catalog DROP CONSTRAINT IF EXISTS stimuli_catalog_content_type_check;

-- STEP 3: Verify constraint is gone
SELECT 'Constraint dropped - content_type is now unconstrained' as status;
