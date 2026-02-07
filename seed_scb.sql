
-- 1. Create the Table (if not exists)
CREATE TABLE IF NOT EXISTS scb_tables (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    api_path TEXT NOT NULL,
    keywords TEXT,
    dimensions TEXT,
    last_updated INTEGER
);

-- 2. Seed SCB Tables with verified Known-Good tables
-- Deaths (Total) - Verified "TAB4392"
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4392', 
    'Births and deaths per month by sex. Year 1851-2024', 
    'Historical record of births and deaths in Sweden from 1851 to present.',
    'tables/TAB4392',
    '["deaths", "births", "population", "mortality", "history"]',
    NULL,
    1735689600000 -- Approx 2025-01-01
);

-- Inflation (CPI) - Verified "TAB3673"
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB3673', 
    'Consumer Price Index (CPI), monthly and annual changes. Month 2014M01-2025M12', 
    'Current official inflation statistics (CPI) for Sweden.',
    'tables/TAB3673',
    '["inflation", "cpi", "prices", "economy"]',
    NULL,
    1735689600000
);
