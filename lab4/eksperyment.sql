set statistics io on;
set statistics time on;
SET FORCEPLAN ON;

-- TABLE CREATION
CREATE TABLE AccountingDocuments (
    DocumentID INT IDENTITY,
    CompanyCode VARCHAR(10),              
    FiscalYear INT,                       
    DocumentNumber VARCHAR(20),           
    PostingDate DATE,
    DocumentDate DATE,
    Amount DECIMAL(18,2),
    Currency VARCHAR(3),                
    DocumentType VARCHAR(5),              
    IsDeleted BIT DEFAULT 0,              
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- INSERT DATA
INSERT INTO AccountingDocuments (
    CompanyCode, FiscalYear, DocumentNumber,
    PostingDate, DocumentDate, Amount,
    Currency, DocumentType, IsDeleted
)
SELECT
    CHOOSE(ABS(CHECKSUM(NEWID())) % 3 + 1, 'PL01', 'DE02', 'US03'),
    2020 + ABS(CHECKSUM(NEWID())) % 5,
    FORMAT(ABS(CHECKSUM(NEWID())) % 999999, '000000'),
    DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 1000, GETDATE()),
    DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 1000, GETDATE()),
    ROUND(RAND(CHECKSUM(NEWID())) * 10000, 2),
    CHOOSE(ABS(CHECKSUM(NEWID())) % 3 + 1, 'PLN', 'EUR', 'USD'),
    CHOOSE(ABS(CHECKSUM(NEWID())) % 4 + 1, 'KR', 'DR', 'SA', 'AB'),
    IIF(ABS(CHECKSUM(NEWID())) % 100 < 5, 1, 0)  
FROM sys.all_objects a CROSS JOIN sys.all_objects b
WHERE a.object_id < 200 AND b.object_id < 100;

-- NUMBER OF ROWS
SELECT COUNT(1) FROM AccountingDocuments;


-- QUERY 1
SELECT * FROM AccountingDocuments
WHERE PostingDate BETWEEN '2024-01-01' AND '2024-01-31';

CREATE CLUSTERED INDEX IX_AccountingDocuments_PostingDate
ON AccountingDocuments(PostingDate);

SELECT * FROM AccountingDocuments
WHERE YEAR(PostingDate) = 2024 AND MONTH(PostingDate) = 1;

drop  INDEX IX_AccountingDocuments_PostingDate ON AccountingDocuments;

-- QUERY 2
SELECT CompanyCode, FiscalYear, Amount, Currency FROM AccountingDocuments
WHERE CompanyCode = 'PL01' AND FiscalYear = 2023;

CREATE NONCLUSTERED INDEX IX_AD_Company_Year -- 1
ON AccountingDocuments(CompanyCode, FiscalYear);

CREATE NONCLUSTERED INDEX IX_AD_Company_Year2 -- 2
ON AccountingDocuments(CompanyCode, FiscalYear)
INCLUDE (Amount, Currency);

drop INDEX IX_AD_Company_Year2 -- 2
ON AccountingDocuments

-- QUERY 3
SELECT CompanyCode, PostingDate, Amount, Currency FROM AccountingDocuments
WHERE IsDeleted = 0 AND CompanyCode = 'PL01' AND PostingDate > '2024-01-01';

CREATE NONCLUSTERED INDEX IX_AD_NotDeleted
ON AccountingDocuments(CompanyCode, PostingDate)
INCLUDE (Amount, Currency)
WHERE IsDeleted = 0;

SELECT CompanyCode, PostingDate, Amount, Currency FROM AccountingDocuments WITH (INDEX(IX_AD_NotDeleted))
WHERE PostingDate > '2024-01-01';

SELECT CompanyCode, PostingDate, Amount, Currency FROM AccountingDocuments -- 2
WHERE CompanyCode = 'PL01' AND PostingDate > '2024-01-01';


-- QUERY 4
SELECT CompanyCode, DocumentDate
FROM AccountingDocuments
GROUP BY CompanyCode, DocumentDate;

CREATE CLUSTERED COLUMNSTORE INDEX IX_AD_Columnstore
ON AccountingDocuments;

-- query 5

SELECT * FROM AccountingDocuments --WITH (INDEX(IX_AD_Company_Year))
WHERE CompanyCode = 'PL01';

