-- Update prompt_events table to support rich dashboard display
-- This script adds the missing fields that the dashboard expects

-- First, let's add any missing columns that the dashboard might need
-- Note: These are mostly already supported via metadata JSONB, but we'll ensure they're properly structured

-- Add a status column to match the dashboard expectations (flagged, blocked, etc.)
ALTER TABLE public.prompt_events 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'flagged' 
CHECK (status IN ('pending', 'processed', 'approved', 'flagged', 'blocked'));

-- Add a platform column for easier querying (extracted from metadata)
ALTER TABLE public.prompt_events 
ADD COLUMN IF NOT EXISTS platform TEXT;

-- Add a url column for easier querying (extracted from metadata)  
ALTER TABLE public.prompt_events 
ADD COLUMN IF NOT EXISTS url TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_prompt_events_status ON public.prompt_events(status);
CREATE INDEX IF NOT EXISTS idx_prompt_events_platform ON public.prompt_events(platform);

-- Function to update existing records with extracted metadata
CREATE OR REPLACE FUNCTION update_prompt_events_from_metadata()
RETURNS INTEGER AS $$
DECLARE
    record_count INTEGER := 0;
    event_record RECORD;
BEGIN
    -- Update platform and url from metadata for existing records
    FOR event_record IN 
        SELECT id, metadata 
        FROM public.prompt_events 
        WHERE platform IS NULL OR url IS NULL
    LOOP
        UPDATE public.prompt_events 
        SET 
            platform = COALESCE(
                metadata->>'platform',
                CASE 
                    WHEN source = 'chrome_extension' THEN 'chrome_extension'
                    WHEN source = 'desktop_agent' THEN 'desktop_agent'
                    ELSE 'api'
                END
            ),
            url = COALESCE(metadata->>'url', 'unknown'),
            status = CASE 
                WHEN risk_level = 'high' THEN 'flagged'
                WHEN risk_level = 'critical' THEN 'blocked'
                ELSE 'processed'
            END
        WHERE id = event_record.id;
        
        record_count := record_count + 1;
    END LOOP;
    
    RETURN record_count;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT update_prompt_events_from_metadata() as updated_records;

-- Create a function to standardize metadata structure for dashboard compatibility
CREATE OR REPLACE FUNCTION standardize_prompt_event_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure metadata has the required structure for dashboard display
    NEW.metadata = jsonb_build_object(
        'platform', COALESCE(NEW.platform, NEW.metadata->>'platform', 'unknown'),
        'url', COALESCE(NEW.url, NEW.metadata->>'url', 'unknown'),
        'detected_pii', COALESCE(NEW.metadata->'detected_pii', '[]'::jsonb),
        'mapped_controls', COALESCE(NEW.metadata->'mapped_controls', '[]'::jsonb),
        'flagged', CASE WHEN NEW.risk_level IN ('high', 'critical') THEN true ELSE false END,
        'extension_version', COALESCE(NEW.metadata->>'extension_version', 'unknown'),
        'detection_method', COALESCE(NEW.metadata->>'detection_method', 'unknown'),
        'model_used', COALESCE(NEW.metadata->>'model_used', NEW.model),
        'cost_breakdown', COALESCE(NEW.metadata->'cost_breakdown', jsonb_build_object(
            'input', NEW.usd_cost * 0.6,
            'output', NEW.usd_cost * 0.4
        )),
        'captured_at', NEW.captured_at,
        'risk_types', COALESCE(NEW.metadata->'detected_risks', jsonb_build_array(NEW.risk_type)),
        'integrity_category', CASE 
            WHEN NEW.integrity_score < 30 THEN 'critical'
            WHEN NEW.integrity_score < 50 THEN 'high_risk'
            WHEN NEW.integrity_score < 70 THEN 'moderate'
            ELSE 'low_risk'
        END
    );
    
    -- Update platform and url columns from metadata
    NEW.platform = COALESCE(NEW.platform, NEW.metadata->>'platform', 'unknown');
    NEW.url = COALESCE(NEW.url, NEW.metadata->>'url', 'unknown');
    
    -- Set status based on risk level if not already set
    IF NEW.status IS NULL THEN
        NEW.status = CASE 
            WHEN NEW.risk_level = 'high' THEN 'flagged'
            WHEN NEW.risk_level = 'critical' THEN 'blocked'
            ELSE 'processed'
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically standardize metadata on insert/update
DROP TRIGGER IF EXISTS standardize_prompt_event_metadata_trigger ON public.prompt_events;
CREATE TRIGGER standardize_prompt_event_metadata_trigger
    BEFORE INSERT OR UPDATE ON public.prompt_events
    FOR EACH ROW
    EXECUTE FUNCTION standardize_prompt_event_metadata();

-- Sample insert to test the new structure (this will be automatically formatted)
INSERT INTO public.prompt_events (
    user_id,
    model,
    usd_cost,
    prompt_tokens,
    completion_tokens,
    integrity_score,
    risk_type,
    risk_level,
    prompt_text,
    source,
    metadata
) VALUES (
    (SELECT id FROM public.users LIMIT 1), -- Use first available user
    'gpt-4',
    0.0045,
    150,
    75,
    45,
    'financial',
    'high',
    'My credit card number is 4532-1234-5678-9012 and the CVV is 123',
    'chrome_extension',
    jsonb_build_object(
        'platform', 'chatgpt',
        'url', 'https://chat.openai.com',
        'detected_pii', jsonb_build_array('CREDIT_CARD', 'CVV'),
        'mapped_controls', jsonb_build_array(
            jsonb_build_object('controlId', 'NIST-SC-28', 'description', 'Protection of Information at Rest'),
            jsonb_build_object('controlId', 'PCI-DSS-3.4', 'description', 'Render PAN unreadable')
        ),
        'extension_version', '2.0.8',
        'detection_method', 'real_time_analysis'
    )
) ON CONFLICT DO NOTHING;

-- Create a view for easier dashboard querying with all the computed fields
CREATE OR REPLACE VIEW public.flagged_prompts_view AS
SELECT 
    pe.id,
    pe.user_id,
    pe.model,
    pe.usd_cost,
    pe.prompt_tokens,
    pe.completion_tokens,
    pe.integrity_score,
    pe.risk_type,
    pe.risk_level,
    pe.captured_at,
    pe.prompt_text,
    pe.response_text,
    pe.source,
    pe.platform,
    pe.url,
    pe.status,
    pe.metadata,
    -- Computed fields for dashboard display
    CASE 
        WHEN LENGTH(pe.prompt_text) > 80 THEN SUBSTRING(pe.prompt_text, 1, 80) || '...'
        ELSE COALESCE(pe.prompt_text, 'No prompt text available')
    END as summary,
    
    -- Extract framework tags from mapped_controls
    COALESCE(
        (SELECT jsonb_agg(DISTINCT framework) 
         FROM (
             SELECT CASE 
                 WHEN (control->>'controlId') LIKE 'NIST-%' THEN 'NIST'
                 WHEN (control->>'controlId') LIKE 'PCI-%' THEN 'PCI-DSS'
                 WHEN (control->>'controlId') LIKE 'OWASP-%' THEN 'OWASP'
                 WHEN (control->>'controlId') LIKE 'SOC-%' THEN 'SOC 2'
                 WHEN (control->>'controlId') LIKE 'ISO-%' THEN 'ISO 27001'
                 ELSE UPPER(pe.risk_type)
             END as framework
             FROM jsonb_array_elements(pe.metadata->'mapped_controls') as control
         ) frameworks),
        jsonb_build_array(UPPER(pe.risk_type))
    ) as frameworks,
    
    -- Extract PII types
    COALESCE(
        (SELECT jsonb_agg(DISTINCT pii_type) 
         FROM jsonb_array_elements_text(pe.metadata->'detected_pii') as pii_type),
        '[]'::jsonb
    ) as pii_types,
    
    -- Format relative date
    CASE 
        WHEN pe.captured_at > NOW() - INTERVAL '1 hour' THEN 'just now'
        WHEN pe.captured_at > NOW() - INTERVAL '1 day' THEN 
            EXTRACT(hour FROM NOW() - pe.captured_at)::text || ' hours ago'
        WHEN pe.captured_at > NOW() - INTERVAL '7 days' THEN 
            EXTRACT(day FROM NOW() - pe.captured_at)::text || ' days ago'
        ELSE TO_CHAR(pe.captured_at, 'Mon DD, YYYY')
    END as relative_date

FROM public.prompt_events pe
WHERE pe.risk_level IN ('medium', 'high', 'critical') 
   OR pe.metadata->>'flagged' = 'true'
ORDER BY pe.captured_at DESC;

-- Grant permissions for the view
GRANT SELECT ON public.flagged_prompts_view TO authenticated;

-- Note: RLS policies cannot be applied to views - they inherit from the underlying table
-- The flagged_prompts_view will use the existing RLS policy from prompt_events table

COMMENT ON TABLE public.prompt_events IS 'Enhanced table for storing prompt analysis events with rich metadata for dashboard display';
COMMENT ON COLUMN public.prompt_events.status IS 'Processing status: pending, processed, approved, flagged, blocked';
COMMENT ON COLUMN public.prompt_events.platform IS 'Platform where prompt was captured (extracted from metadata)';
COMMENT ON COLUMN public.prompt_events.url IS 'URL where prompt was captured (extracted from metadata)';
COMMENT ON VIEW public.flagged_prompts_view IS 'Pre-computed view for dashboard flagged prompts display with all required fields'; 