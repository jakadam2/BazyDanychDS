set statistics io on;
set statistics time on;

CREATE TABLE AccountingDocuments (
    DocumentID INT IDENTITY PRIMARY KEY,
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

SELECT COUNT(1) FROM AccountingDocuments;

SELECT * FROM AccountingDocuments
WHERE PostingDate BETWEEN '2024-01-01' AND '2024-01-31';
