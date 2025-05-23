set statistics io on;
set statistics time on;

CREATE DATABASE LAB5;
USE LAB5;

-- ZADANIE 2

select * into product from adventureworks.production.product;

create nonclustered index product_range_idx
 on product (productsubcategoryid, listprice) include (name)
where productsubcategoryid >= 27 and productsubcategoryid <= 36;
select name, productsubcategoryid, listprice
from product
where productsubcategoryid >= 26 and productsubcategoryid <= 36;select name, productsubcategoryid, listprice  
from product  
where productsubcategoryid < 27 or productsubcategoryid > 36;-- ZADANIE 3select * into purchaseorderdetail from adventureworks.purchasing.purchaseorderdetail;select rejectedqty, ((rejectedqty/orderqty)*100) as rejectionrate, productid, duedate
from purchaseorderdetail
order by rejectedqty desc, productid asc;CREATE NONCLUSTERED INDEX purchaseorderdetail_rejectedqty_productid_idx
ON purchaseorderdetail (rejectedqty DESC, productid ASC)
INCLUDE (orderqty, duedate);




