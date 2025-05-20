set statistics io on;
set statistics time on;

select * into customer from adventureworks.sales.customer;

select * from customer where storeid = 594;
select * from customer where storeid between 594 and 610;

create  index customer_store_cls_idx on customer(storeid);

select * from customer where storeid = 594;
select * from customer where storeid between 594 and 610;

create clustered index customer_store_cls_idx_clustered on customer(storeid);

select * from customer where storeid = 594;
select * from customer where storeid between 594 and 610;	

-- zad 4
drop table address;
select * into address from adventureworks.person.address;create index address_postalcode_1
on address (postalcode)
include (addressline1, addressline2, city, stateprovinceid);
go

create index address_postalcode_2
on address (postalcode, addressline1, addressline2, city, stateprovinceid);
goselect addressline1, addressline2, city, stateprovinceid, postalcode
from address
WITH(INDEX(Address_PostalCode_2))
where postalcode between '98000' and '99999';select i.name as indexname, sum(s.used_page_count) * 8 as indexsizekb  
from sys.dm_db_partition_stats as s  
inner join sys.indexes as i on s.object_id = i.object_id and s.index_id = i.index_id  
where i.name = 'address_postalcode_1' or i.name = 'address_postalcode_2'  
group by i.name  
go


-- zad 5
select * into billofmaterials  
from adventureworks.production.billofmaterials;


create nonclustered index billofmaterials_cond_idx  
    on billofmaterials (componentid, startdate)  
    where enddate is not null


select productassemblyid, componentid, startdate  
from billofmaterials  
WITH(INDEX(billofmaterials_cond_idx))
where enddate is not null  
    and componentid = 327  
    and startdate >= '2010-08-05'