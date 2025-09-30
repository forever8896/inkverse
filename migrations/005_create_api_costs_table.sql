-- API costs table for tracking provider pricing over time
CREATE TABLE api_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    service VARCHAR(100) NOT NULL,
    cost_per_unit NUMERIC(10,6) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Exclude constraint to prevent overlapping active cost records for same provider/service
    EXCLUDE USING gist (
        provider WITH =,
        service WITH =,
        tstzrange(valid_from, valid_to, '[)') WITH &&
    )
);

-- Indexes for api_costs table
CREATE INDEX idx_api_costs_provider_service ON api_costs(provider, service);
CREATE INDEX idx_api_costs_valid_from ON api_costs(valid_from DESC);
CREATE INDEX idx_api_costs_active ON api_costs(valid_to) WHERE valid_to IS NULL;
