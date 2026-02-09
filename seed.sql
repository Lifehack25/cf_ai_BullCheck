INSERT OR REPLACE INTO source (id, organization, key, api_url, description, is_enabled, created_at, updated_at)
VALUES (
  'scb-source-id',
  'SCB (Statistiska centralbyrån)',
  'SCB',
  'https://api.scb.se/OV0104/v1/doris/sv/ssd',
  'Comprehensive official statistics for Sweden. Covers all sectors including economy, population, environment, trade, housing, and social conditions.',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);

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
    '["deaths","death","died","mortality","fatalities","births","born","live births","monthly","sex","men","women","population"]',
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
    '["inflation","cpi","consumer price index","price change","monthly change","annual change","inflation rate","prices","cost of living"]',
    NULL,
    1735689600000
);

-- Demographics and Population
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5890',
    'Population by age and sex. Year 1860-2024',
    'Population counts by age and sex in Sweden.',
    'tables/TAB5890',
    '["population","people","residents","age","age group","sex","gender","men","women","boys","girls","demographics"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4365',
    'Population and population changes in Sweden by sex. Year 1749-2024',
    'Long-term population levels and changes by sex in Sweden.',
    'tables/TAB4365',
    '["population change","population growth","population decline","natural increase","population size","births","deaths","marriages","divorces","divorce","divorced","migration","net migration","population trend"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1625',
    'Population statistics by region and sex. Month 2000M01-2024M12',
    'Monthly population statistics by region and sex.',
    'tables/TAB1625',
    '["population by region","population by county","population monthly","population statistics","sex","gender","region","county","municipality","residents"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5169',
    'Population statistics per quarter/half year/year by region and sex. Year 2000-2024',
    'Quarterly, half-year, and yearly population statistics by region and sex.',
    'tables/TAB5169',
    '["population statistics","population quarterly","population yearly","population by region","sex","gender","region","county"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4822',
    'Population by country of birth, age and sex. Year 2000-2024',
    'Population by country of birth, age, and sex.',
    'tables/TAB4822',
    '["country of birth","foreign born","born abroad","native born","population by birth country","age","sex","immigrant background"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB6030',
    'Population by region, country of birth and sex. Year 2000-2024',
    'Population by region, country of birth, and sex.',
    'tables/TAB6030',
    '["population by region","country of birth","foreign born","immigrant background","region","county","sex"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1531',
    'Number and percentage of persons and households by region and household size. Year 2011-2024',
    'Households and persons by household size and region.',
    'tables/TAB1531',
    '["households","household size","persons","family size","region","county","population households"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB6568',
    'Number of households per region by type of household. Year 2011-2024',
    'Households by type and region.',
    'tables/TAB6568',
    '["households","household type","family type","single households","couples","region","county"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB638',
    'Population by region, marital status, age and sex. Year 1968-2024',
    'Population by marital status, age, sex, and region.',
    'tables/TAB638',
    '["marital status","married","single","divorced","widowed","population by marital status","age","sex","region"]',
    NULL,
    1735689600000
);

-- Births, Deaths, Marriages, Life Expectancy
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4376',
    'Live births, stillbirths and infant mortality rates by sex. Year 1749-2024',
    'Live births, stillbirths, and infant mortality rates by sex.',
    'tables/TAB4376',
    '["live births","stillbirths","infant mortality","infant deaths","births","newborns","mortality","perinatal"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4644',
    'Crude birth rate. The ratio of the number of live births to the average population by region. Year 2010-2024',
    'Crude birth rate by region.',
    'tables/TAB4644',
    '["birth rate","fertility","crude birth rate","births per population","live births rate","region"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB959',
    'Deaths by region, age (the year of birth) and sex. Year 1968-2024',
    'Deaths by region, age, and sex.',
    'tables/TAB959',
    '["deaths","death","died","mortality","fatalities","age","sex","region","county","deceased"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5934',
    'Deaths per month by region, Region of birth, age and sex. Year 2000-2024',
    'Monthly deaths by region, region of birth, age, and sex.',
    'tables/TAB5934',
    '["deaths","death","died","mortality","monthly deaths","region of birth","age","sex","region"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5811',
    'Number of marriages and divorces per month by region. Year 2000-2024',
    'Monthly marriages and divorces by region.',
    'tables/TAB5811',
    '["marriages","marriage","weddings","divorces","divorce","divorced","marriage rate","divorce rate","monthly","region"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4400',
    'Average age at marriage by sex. Year 1871-2024',
    'Average age at marriage by sex.',
    'tables/TAB4400',
    '["average age at marriage","marriage age","wedding age","married age","men","women","sex"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB2823',
    'Life expectancy by county and sex (1966-1970)-(2020-2024)',
    'Life expectancy by county and sex.',
    'tables/TAB2823',
    '["life expectancy","longevity","expected lifespan","mortality","county","region","sex"]',
    NULL,
    1735689600000
);

-- Migration and Asylum
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1617',
    'Immigrations and emigrations by country of birth and sex. Year 2000-2024',
    'Immigration and emigration by country of birth and sex.',
    'tables/TAB1617',
    '["immigration","emigration","migrants","migrations","country of birth","sex","inflows","outflows"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB6039',
    'Immigrations and emigrations by country of emi-/immigration, region of birth, age and sex. Year 2000-2024',
    'Immigration and emigration by country, region of birth, age, and sex.',
    'tables/TAB6039',
    '["immigration","emigration","migrant flows","country of immigration","country of emigration","region of birth","age","sex"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1530',
    'Domestic migration by type, age and sex. Year 2000-2024',
    'Domestic migration by type, age, and sex.',
    'tables/TAB1530',
    '["domestic migration","internal migration","moves","moving within Sweden","age","sex","migration type"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5189',
    'Foreign-born by country of birth and year since last immigration. Year 2000-2024',
    'Foreign-born population by country of birth and years since last immigration.',
    'tables/TAB5189',
    '["foreign born","born abroad","immigrant","time since immigration","years since immigration","country of birth"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5183',
    'Asylum-seekers by country of citizenship and sex. Month, quarter, half year, whole year. Year 2002-2025',
    'Asylum seekers by country of citizenship and sex.',
    'tables/TAB5183',
    '["asylum seekers","asylum","refugees","citizenship","country of citizenship","sex","applications"]',
    NULL,
    1735689600000
);

-- Labour Market
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB2894',
    'Unemployed persons aged 15-74 (LFS) by duration of unemployment, sex and age. Year 2005-2025',
    'Annual unemployment by duration, sex, and age (LFS).',
    'tables/TAB2894',
    '["unemployment","unemployed","jobless","lfs","labour force survey","annual unemployment","age","sex"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB2901',
    'Unemployed persons aged 15-74 (LFS) by duration of unemployment, sex and age. Month 2005M01-2025M12',
    'Monthly unemployment by duration, sex, and age (LFS).',
    'tables/TAB2901',
    '["unemployment","unemployed","jobless","lfs","monthly unemployment","age","sex"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB2918',
    'Population aged 15-74 (LFS) by labour force status, sex, marital status and whether there are children living at home or not. Year 2005-2025',
    'Annual labour force status by sex and household situation (LFS).',
    'tables/TAB2918',
    '["labour force","labor force","employment status","employed","unemployed","outside labor force","lfs","annual"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB2920',
    'Population aged 15-74 (LFS) by labour force status, sex, marital status and whether there are children living at home or not. Month 2005M01-2025M12',
    'Monthly labour force status by sex and household situation (LFS).',
    'tables/TAB2920',
    '["labour force","labor force","employment status","employed","unemployed","lfs","monthly"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5663',
    'Key figures from Population by labour market status (BAS). Employment rate and unemployment by region. Preliminary statistics. Month 2024M01-2025M11',
    'Employment rate and unemployment by region (BAS).',
    'tables/TAB5663',
    '["employment rate","unemployment rate","labour market status","region","county","bas","employment","jobless"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5531',
    'Job openings by sector. Quarter 2001K1-2024K1',
    'Job openings by sector.',
    'tables/TAB5531',
    '["job openings","vacancies","hiring","labor demand","sector","business","recruitment"]',
    NULL,
    1735689600000
);

-- Wages and Income
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1972',
    'Average monthly salary in the municipalities (KLK). Month 1999M01-2025M11',
    'Average monthly salary in municipalities.',
    'tables/TAB1972',
    '["average salary","average pay","monthly salary","municipalities","public sector","local government","wages"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1973',
    'Average monthly salary in the regional authorities (KLR). Month 1999M01-2025M11',
    'Average monthly salary in regional authorities.',
    'tables/TAB1973',
    '["average salary","average pay","monthly salary","regional authorities","regions","public sector","wages"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5932',
    'Average salary and salary dispersion by sector, occupation (SSYK 2012) and sex. Year 2023-2024',
    'Average salary and salary dispersion by sector, occupation, and sex.',
    'tables/TAB5932',
    '["average salary","salary dispersion","wages","pay gap","occupation","sector","sex","gender"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1121',
    'Income inequality indicators by region. Year 2011-2024',
    'Income inequality indicators by region.',
    'tables/TAB1121',
    '["income inequality","gini","inequality","income distribution","region","county","income gap"]',
    NULL,
    1735689600000
);

-- Economy and Prices
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5621',
    'GDP: expenditure approach by type of use, aggregated. Year 1950-2023',
    'GDP by expenditure approach.',
    'tables/TAB5621',
    '["gdp","gross domestic product","economic output","expenditure approach","consumption","investment","government spending","exports","imports"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB3100',
    'National accounts, GDP (ESA2010), change in volume. Quarter 1993K1-2025K3',
    'Quarterly GDP volume change.',
    'tables/TAB3100',
    '["gdp","economic growth","gdp growth","volume change","quarterly gdp","national accounts"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB443',
    'National accounts, GDP indicator (ESA2010), 2011=100 Month 2000M01-2025M12',
    'Monthly GDP indicator (index).',
    'tables/TAB443',
    '["gdp indicator","economic activity","monthly gdp","business cycle","national accounts","index"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB3138',
    'Gross Regional Domestic Product (GRDP), number of employed and wages and salaries (ESA2010) by region (NUTS1-3). Year 2000-2024',
    'Regional GDP with employment and wages by region.',
    'tables/TAB3138',
    '["regional gdp","grdp","gross regional domestic product","regional economy","region","county","economic output"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB6596',
    'Consumer Price Index (CPI), total 2020=100. Month 1980M01-2025M12',
    'CPI total index (2020=100).',
    'tables/TAB6596',
    '["cpi","consumer price index","inflation","price index","prices","cost of living","index"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB3674',
    'Price indices in Producer and Import stages (PPI), change from previous period. Month 2014M01-2025M12',
    'Producer and import price index (PPI) changes.',
    'tables/TAB3674',
    '["ppi","producer price index","import prices","export prices","producer prices","price change","industrial prices"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB3948',
    'Retail sale by industry NACE Rev. 2, index 2021=100. Month 1991M01-2025M12',
    'Retail sales index by industry.',
    'tables/TAB3948',
    '["retail sales","retail trade","sales index","consumer spending","shops","index"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5390',
    'Imports of goods, Exports of goods and Net Trade of goods. Year 1975-2025',
    'Annual trade in goods: imports, exports, and net trade.',
    'tables/TAB5390',
    '["exports","imports","trade","net trade","trade balance","goods trade","international trade"]',
    NULL,
    1735689600000
);

-- Housing and Construction
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB796',
    'Building permits for new construction, number and gross floor area by region and type of building. Quarterly 1996K1-2025K3',
    'Building permits by region, building type, and floor area.',
    'tables/TAB796',
    '["building permits","construction permits","new construction","floor area","buildings","region"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB2534',
    'Building permits for new construction, number of dwellings in residential buildings and buildings for seasonal and secondary use by region and type of building. Quarterly 1996K1-2025K3',
    'Building permits for dwellings by region and building type.',
    'tables/TAB2534',
    '["building permits","dwellings","housing starts","new dwellings","residential buildings","region"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB822',
    'Number of dwellings by region, type of building and period of construction. Year 2013-2024',
    'Housing stock by region, building type, and construction period.',
    'tables/TAB822',
    '["dwellings","housing stock","housing units","buildings","region","construction period"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB5382',
    'Price per dwelling for newly constructed conventional multi-dwelling buildings by region, type of investor and gross-/net price. Year 1998-2023',
    'Prices for newly built multi-dwelling buildings by region.',
    'tables/TAB5382',
    '["house prices","price per dwelling","new construction","apartments","multi-dwelling","housing prices"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4618',
    'Rent in rented dwellings by region, number of rooms and ownership. Year 2016-2025',
    'Rents by region, rooms, and ownership type.',
    'tables/TAB4618',
    '["rent","rents","rental prices","rented dwellings","rooms","housing costs","region"]',
    NULL,
    1735689600000
);

-- Energy and Environment
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4310',
    'Electricity prices for households by consumer category. Half-year 2014H2-2025H1',
    'Electricity prices for households.',
    'tables/TAB4310',
    '["electricity prices","power prices","household electricity","energy prices","kwh","utility prices"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB989',
    'Electricity consumption by usage area. Monthly 1990M01-2025M11',
    'Electricity consumption by usage area.',
    'tables/TAB989',
    '["electricity consumption","power consumption","energy use","kwh","usage area","demand"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB78',
    'Electricity production and electricity consumption by bidding zone. Monthly 2021M01-2025M11',
    'Electricity production and consumption by bidding zone.',
    'tables/TAB78',
    '["electricity production","power production","electricity consumption","bidding zone","energy supply","grid"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB4698',
    'Total emissions and removals of greenhouse gases by greenhouse gas and sector. Year 1990-2024',
    'Greenhouse gas emissions and removals by sector.',
    'tables/TAB4698',
    '["greenhouse gas","emissions","co2","climate","environment","ghg","carbon emissions","removals"]',
    NULL,
    1735689600000
);

-- Transport
INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB1277',
    'Vehicles from the vehicle register by type of vehicle and stock. Month 1975M01-2026M01',
    'Vehicle stock by type.',
    'tables/TAB1277',
    '["vehicles","vehicle stock","car stock","registered vehicles","vehicle register","cars","trucks","buses"]',
    NULL,
    1735689600000
);

INSERT OR REPLACE INTO scb_tables (id, title, description, api_path, keywords, dimensions, last_updated)
VALUES (
    'TAB3676',
    'New registrations of passenger cars, month 2013M12-2026M01',
    'Monthly new registrations of passenger cars.',
    'tables/TAB3676',
    '["car registrations","new registrations","passenger cars","vehicle registrations","car sales","monthly registrations"]',
    NULL,
    1735689600000
);
