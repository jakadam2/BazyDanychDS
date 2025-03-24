
## SQL - Funkcje okna (Window functions) <br> Lab 1

---

**Imiona i nazwiska:** Adam  Woźny, [wez sie tu wpisz xd]
--- 


Celem ćwiczenia jest przygotowanie środowiska pracy, wstępne zapoznanie się z działaniem funkcji okna (window functions) w SQL, analiza wydajności zapytań i porównanie z rozwiązaniami przy wykorzystaniu "tradycyjnych" konstrukcji SQL

Swoje odpowiedzi wpisuj w miejsca oznaczone jako:

---
> Wyniki: 

```sql
--  ...
```

---

Ważne/wymagane są komentarze.

Zamieść kod rozwiązania oraz zrzuty ekranu pokazujące wyniki, (dołącz kod rozwiązania w formie tekstowej/źródłowej)

Zwróć uwagę na formatowanie kodu

---

## Oprogramowanie - co jest potrzebne?

Do wykonania ćwiczenia potrzebne jest następujące oprogramowanie:
- MS SQL Server - wersja 2019, 2022
- PostgreSQL - wersja 15/16/17
- SQLite
- Narzędzia do komunikacji z bazą danych
	- SSMS - Microsoft SQL Managment Studio
	- DtataGrip lub DBeaver
-  Przykładowa baza Northwind
	- W wersji dla każdego z wymienionych serwerów

Oprogramowanie dostępne jest na przygotowanej maszynie wirtualnej

## Dokumentacja/Literatura

- Kathi Kellenberger,  Clayton Groom, Ed Pollack, Expert T-SQL Window Functions in SQL Server 2019, Apres 2019
- Itzik Ben-Gan, T-SQL Window Functions: For Data Analysis and Beyond, Microsoft 2020

- Kilka linków do materiałów które mogą być pomocne
	 - [https://learn.microsoft.com/en-us/sql/t-sql/queries/select-over-clause-transact-sql?view=sql-server-ver16](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-over-clause-transact-sql?view=sql-server-ver16)
	- [https://www.sqlservertutorial.net/sql-server-window-functions/](https://www.sqlservertutorial.net/sql-server-window-functions/)
	- [https://www.sqlshack.com/use-window-functions-sql-server/](https://www.sqlshack.com/use-window-functions-sql-server/)
	- [https://www.postgresql.org/docs/current/tutorial-window.html](https://www.postgresql.org/docs/current/tutorial-window.html)
	- [https://www.postgresqltutorial.com/postgresql-window-function/](https://www.postgresqltutorial.com/postgresql-window-function/)
	- [https://www.sqlite.org/windowfunctions.html](https://www.sqlite.org/windowfunctions.html)
	- [https://www.sqlitetutorial.net/sqlite-window-functions/](https://www.sqlitetutorial.net/sqlite-window-functions/)


- W razie potrzeby - opis Ikonek używanych w graficznej prezentacji planu zapytania w SSMS jest tutaj:
	- [https://docs.microsoft.com/en-us/sql/relational-databases/showplan-logical-and-physical-operators-reference](https://docs.microsoft.com/en-us/sql/relational-databases/showplan-logical-and-physical-operators-reference)

## Przygotowanie

Uruchom SSMS
- Skonfiguruj połączenie  z bazą Northwind na lokalnym serwerze MS SQL 

Uruchom DataGrip (lub Dbeaver)
- Skonfiguruj połączenia z bazą Northwind3
	- na lokalnym serwerze MS SQL
	- na lokalnym serwerze PostgreSQL
	- z lokalną bazą SQLite

---
# Zadanie 1 - obserwacja

Wykonaj i porównaj wyniki następujących poleceń.

```sql
select avg(unitprice) avgprice
from products p;

select avg(unitprice) over () as avgprice
from products p;

select categoryid, avg(unitprice) avgprice
from products p
group by categoryid

select avg(unitprice) over (partition by categoryid) as avgprice
from products p;
```

Jaka jest są podobieństwa, jakie różnice pomiędzy grupowaniem danych a działaniem funkcji okna?

---
> Wyniki: 

```sql
-- zwraca jeden rekord wynikowy wraz z średnią ceną produktu, bez żadnych kryteriów
select avg(unitprice) avgprice
from products p;

-- jako funkcja okna dla każdego rekordu zwraca wartość funkcji avg(unitprice), 
-- również bez przyjętego kryterium kategoryzującego, tak więc dla każdego rekordu zwraca 
-- średnią cene wszystkich produktów
select avg(unitprice) over () as avgprice
from products p;

-- jako funkcja agregująca zwraca wartość avg(unitprice), ale z jawnie podanym
-- kryterium grupowania po ID kategorii
-- jako wynik jest podana tabela z wszystkimi ID kategorii i przypisanymi im średnimi cenami z danej kategorii
select categoryid, avg(unitprice) avgprice
from products p
group by categoryid;

-- funkcja okna z jawnie podanym kryterium kategoryzującym na poziomie ID kategorii
-- zwraca tyle rekordów ile jest produktów, dla każdeggo produktu zwraca średnią cene produktów w tej kategorii co on jest
select avg(unitprice) over (partition by categoryid) as avgprice
from products p;

-- Można zauważyć, że funkcje okna wykonują się szybciej od funkcji agregujących 
-- Jest to intuicyjne, bo funkcje agregujące poza wyliczeniem wartości, muszą wykonać również obliczenia umożliwiające agregacje
-- Jednak, z racji na bardzo krótkie czasy wykonania, cięzko stwierdzić to z całą pewnością
-- oraz określić rząd o jakie funkcje okna są potencjalnie szybsze 
```


---
# Zadanie 2 - obserwacja

Wykonaj i porównaj wyniki następujących poleceń.

```sql
--1)

select p.productid, p.ProductName, p.unitprice,  
       (select avg(unitprice) from products) as avgprice  
from products p  
where productid < 10

--2)
select p.productid, p.ProductName, p.unitprice,  
       avg(unitprice) over () as avgprice  
from products p  
where productid < 10
```


Jaka jest różnica? Czego dotyczy warunek w każdym z przypadków? Napisz polecenie równoważne 
- 1) z wykorzystaniem funkcji okna. Napisz polecenie równoważne 
- 2) z wykorzystaniem podzapytania


---
> Wyniki: 

```sql
--  Różnica (poza śladową wydajnością) polega na tym, że w piewszym zapytaniu w wyniku dla każdego produktu z ID > 10 jest zwracana
--  średnia cena WSZYSTKICH produktów w tej tabeli, a w drugim dla dla każdego produktu z ID > 10 jest zwracana produktów z ID > 10

-- 1) z funkcją okna 
SELECT * FROM 
	(SELECT 
        p.productid,
        p.ProductName,
        p.unitprice,
        AVG(p.unitprice) OVER () AS avgprice
    FROM products p
) t
WHERE t.productid < 10;
-- where zawsze wykonuje sie przed nimi wiec trzeba dac takie cos

-- 2) z podzapytaniem
SELECT p.PRODUCTID
	, p.PRODUCTNAME
	, p.UNITPRICE
	, (SELECT AVG(UNITPRICE) FROM PRODUCTS WHERE PRODUCTID < 10)
FROM PRODUCTS p
WHERE p.PRODUCTID < 10;
```

---

# Zadanie 3

Baza: Northwind, tabela: products

Napisz polecenie, które zwraca: id produktu, nazwę produktu, cenę produktu, średnią cenę wszystkich produktów.

Napisz polecenie z wykorzystaniem z wykorzystaniem podzapytania, join'a oraz funkcji okna. Porównaj czasy oraz plany wykonania zapytań.

Przetestuj działanie w różnych SZBD (MS SQL Server, PostgreSql, SQLite)

W SSMS włącz dwie opcje: Include Actual Execution Plan oraz Include Live Query Statistics

![w:700](_img/window-1.png)

W DataGrip użyj opcji Explain Plan/Explain Analyze

![w:700](_img/window-2.png)


![w:700](_img/window-3.png)


---
> Wyniki: 


```sql
-- z funkcją okna:
SELECT PRODUCTID 
	, PRODUCTNAME
	, UNITPRICE
	, AVG(UNITPRICE) OVER ()
FROM dbo.PRODUCTS;

-- z podzapytaniem
SELECT PRODUCTID 
	, PRODUCTNAME
	, UNITPRICE
	, (SELECT AVG(UNITPRICE) FROM dbo.PRODUCTS)
FROM dbo.PRODUCTS;

-- z joinem
SELECT 
    p.PRODUCTID,
    p.PRODUCTNAME,
    p.UNITPRICE,
    avg_prices.avgprice
FROM products p
JOIN (SELECT AVG(unitprice) AS avgprice FROM products) avg_prices 
ON 1=1;
```

## Wyniki MsSQL

---


# Zadanie 4

Baza: Northwind, tabela products

Napisz polecenie, które zwraca: id produktu, nazwę produktu, cenę produktu, średnią cenę produktów w kategorii, do której należy dany produkt. Wyświetl tylko pozycje (produkty) których cena jest większa niż średnia cena.

Napisz polecenie z wykorzystaniem podzapytania, join'a oraz funkcji okna. Porównaj zapytania. Porównaj czasy oraz plany wykonania zapytań.

Przetestuj działanie w różnych SZBD (MS SQL Server, PostgreSql, SQLite)

---
> Wyniki: 

```sql
--  ...
```

---

|         |     |
| ------- | --- |
| zadanie | pkt |
| 1       | 1   |
| 2       | 1   |
| 3       | 1   |
| 4       | 1   |
| razem   | 4   |
