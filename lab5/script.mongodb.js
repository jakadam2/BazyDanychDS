use('b')

db.customers.find();
db.orders.find();
db.orderdetails.find();

// Zadanie 1
use('b')
db.orders.aggregate([
  { // Customer lookup + unwind, żeby był pojedyńczym dokumentem, a nie listą
    $lookup: {
      from: "customers",
      localField: "CustomerID",
      foreignField: "CustomerID",
      as: "Customer"
    }
  },
  {
    $unwind: "$Customer"
  },
  { // Employees lookup + unwind, żeby był pojedyńczym dokumentem, a nie listą
    $lookup: {
      from: "employees",
      localField: "EmployeeID",
      foreignField: "EmployeeID",
      as: "Employee"
    }
  },
  {
    $unwind: "$Employee"
  },
  { // Shippers lookup + unwind, żeby był pojedyńczym dokumentem, a nie listą
    $lookup: {
      from: "shippers",
      localField: "ShipVia",
      foreignField: "ShipperID",
      as: "Shipper"
    }
  },
  {
    $unwind: "$Shipper"
  },
  { // Orderdetails lookup + unwind, żeby był pojedyńczym dokumentem, a nie listą, ponieważ chcemy uniknąć mapowania po liście
    $lookup: {
      from: "orderdetails",
      localField: "OrderID",
      foreignField: "OrderID",
      as: "Orderdetails"
    }
  },
  {
    $unwind: "$Orderdetails"
  },
  { // pobieramy wartości product i category, ale nie dajemy ich bezpośrednio tylko do zagnieżdżonych dokumentów
    $lookup: {
      from: "products",
      localField: "Orderdetails.ProductID",
      foreignField: "ProductID",
      as: "Product"
    }
  },
  {
    $unwind: "$Product"
  },
  { // tu tak samo
    $lookup: {
      from: "categories",
      localField: "Product.CategoryID",
      foreignField: "CategoryID",
      as: "Category"
    }
  },
  {
    $unwind: "$Category"
  },
  { // proces dokładania wartości do istniejących dokumentów zagnieżdzonych
    $addFields: {
      "Orderdetails.Value": {
        $multiply: [
          "$Orderdetails.UnitPrice",
          "$Orderdetails.Quantity",
          { $subtract: [1, "$Orderdetails.Discount"] }
        ]
      },
      "Orderdetails.product": {
        ProductID: "$Product.ProductID",
        ProductName: "$Product.ProductName",
        QuantityPerUnit: "$Product.QuantityPerUnit",
        CategoryID: "$Category.CategoryID",
        CategoryName: "$Category.CategoryName"
      }
    }
  },
  { // grupujemy, OrderID, Employee, Dates, Freight, Shipment zachowujemy bo są unikalne, a Orderdetails kumulujemy, tak jak przed operacją unwind
    $group: {
      _id: "$OrderID",
      OrderID: { $first: "$OrderID" },
      Customer: { $first: {
        CustomerID: "$Customer.CustomerID",
        CompanyName: "$Customer.CompanyName",
        City: "$Customer.City",
        Country: "$Customer.Country"
      }},
      Employee: { $first: {
        EmployeeID: "$Employee.EmployeeID",
        FirstName: "$Employee.FirstName",
        LastName: "$Employee.LastName",
        Title: "$Employee.Title"
      }},
      Dates: { $first: {
        OrderDate: "$OrderDate",
        RequiredDate: "$RequiredDate"
      }},
      Freight: { $first: "$Freight" },
      Shipment: { $first: {
        Shipper: {
          ShipperID: "$Shipper.ShipperID",
          CompanyName: "$Shipper.CompanyName"
        },
        ShipName: "$ShipName",
        ShipAddress: "$ShipAddress",
        ShipCity: "$ShipCity",
        ShipCountry: "$ShipCountry"
      }},
      Orderdetails: { $push: {
        UnitPrice: "$Orderdetails.UnitPrice",
        Quantity: "$Orderdetails.Quantity",
        Discount: "$Orderdetails.Discount",
        Value: "$Orderdetails.Value",
        product: "$Orderdetails.product"
      }}
    }
  },
  {
    $addFields: {
      OrderTotal: {
        $sum: "$Orderdetails.Value"
      }
    }
  },
  {
    $out: "OrdersInfo"
  }
])


// Zadanie 2
use('b');
db.OrdersInfo.find();

db.OrdersInfo.aggregate([
  {
    $group: {
      _id: "$Customer.CustomerID",
      CustomerID: { $first: "$Customer.CustomerID" },
      CompanyName: { $first: "$Customer.CompanyName" },
      City: { $first: "$Customer.City" },
      Country: { $first: "$Customer.Country" },
      Orders: {
        $push: {
          _id: "$_id",
          OrderID: "$OrderID",
          Employee: "$Employee",
          Dates: "$Dates",
          Orderdetails: "$Orderdetails",
          Freight: "$Freight",
          OrderTotal: "$OrderTotal",
          Shipment: "$Shipment"
        }
      }
    }
  },
  {
    $project: {
      _id: 1,
      CustomerID: 1,
      CompanyName: 1,
      City: 1,
      Country: 1,
      Orders: 1
    }
  },
  {
    $out: "CustomerInfo" // zapis do nowej kolekcji
  }
])

// Zadanie 3
// Zadanie 3 - oryginalne kolekcje 
use('b');
db.orders.aggregate([
  // filtr na dacie
  {
    $match: {
      OrderDate: {
        $gte: ISODate("1997-01-01T00:00:00Z"),
        $lt:  ISODate("1998-01-01T00:00:00Z")
      }
    }
  },

  // dołączenia informacji z innych kolekcji
  {
    $lookup: {
      from: "orderdetails",
      localField: "OrderID",
      foreignField: "OrderID",
      as: "Details"
    }
  },
  { $unwind: "$Details" },

  {
    $lookup: {
      from: "products",
      localField: "Details.ProductID",
      foreignField: "ProductID",
      as: "Prod"
    }
  },
  { $unwind: "$Prod" },

  {
    $lookup: {
      from: "categories",
      localField: "Prod.CategoryID",
      foreignField: "CategoryID",
      as: "Cat"
    }
  },
  { $unwind: "$Cat" },

  // filtr na kategorii
  {
    $match: {
      "Cat.CategoryName": "Confections"
    }
  },

  // dodawanie pola value
  {
    $addFields: {
      lineValue: {
        $round: [
          {
            $multiply: [
              "$Details.UnitPrice",
              "$Details.Quantity",
              { $subtract: [1, "$Details.Discount"] }
            ]
          },
          2
        ]
      }
    }
  },

  // grupowanie po kliencie i suma wartoścu
  {
    $group: {
      _id: "$CustomerID",
      ConfectionsSale97: { $sum: "$lineValue" }
    }
  },

  // dołaczenie informacji o kliencie
  {
    $lookup: {
      from: "customers",
      localField: "_id",
      foreignField: "CustomerID",
      as: "Cust"
    }
  },
  { $unwind: "$Cust" },


  {
    $project: {
      _id: 1,                         
      CustomerID: "$_id",
      CompanyName: "$Cust.CompanyName",
      ConfectionsSale97: 1
    }
  }
]);


// Zadanie 3 - OrdersInfo
use('b');
db.OrdersInfo.aggregate([
  // filtr na dacie
  {
    $match: {
      "Dates.OrderDate": {
        $gte: ISODate("1997-01-01T00:00:00Z"),
        $lt:  ISODate("1998-01-01T00:00:00Z")
      }
    }
  },

  // rozwijanie zamówienia, żeby móc wyfiltrować 
  {
    $unwind: "$Orderdetails"
  },

  // filtr na kategorii
  {
    $match: {
      "Orderdetails.product.CategoryName": "Confections"
    }
  },

  // grupowanie po kliencie
  {
    $group: {
      _id: "$Customer.CustomerID",
      CompanyName: { $first: "$Customer.CompanyName" },
      ConfectionsSale97: { $sum: "$Orderdetails.Value" }
    }
  },
  {
    $project: {
      _id: 1,
      CustomerID: "$_id",
      CompanyName: 1,
      ConfectionsSale97: 1
    }
  }
]);


// Zadanie 3 - CustomerInfo
use('b');
db.CustomerInfo.aggregate([
  // rozwijanie zamówienia, żeby móc wyfiltrować 
  { $unwind: "$Orders" },

  // filtr na dacie
  {
    $match: {
      "Orders.Dates.OrderDate": {
        $gte: ISODate("1997-01-01T00:00:00Z"),
        $lt:  ISODate("1998-01-01T00:00:00Z")
      }
    }
  },

  // rozwijanie zamówienia, żeby móc wyfiltrować 
  { $unwind: "$Orders.Orderdetails" },

  // filtr na kategorii
  {
    $match: {
      "Orders.Orderdetails.product.CategoryName": "Confections"
    }
  },

  // grupowanie po kliencie
  {
    $group: {
      _id: "$CustomerID",
      CompanyName: { $first: "$CompanyName" },
      ConfectionsSale97: { $sum: "$Orders.Orderdetails.Value" }
    }
  },

  {
    $project: {
      _id: 1,
      CustomerID: "$_id",
      CompanyName: 1,
      ConfectionsSale97: 1
    }
  }
]);

// Zadanie 4
// Zadanie 4 - oryginalne kolekcje
use('b');
db.orders.aggregate([
  // dołączenie infromacji o zamówieniach
  {
    $lookup: {
      from: "orderdetails",
      localField: "OrderID",
      foreignField: "OrderID",
      as: "Details"
    }
  },
  { $unwind: "$Details" },

  // obliczanie wartości zamówienia 
  {
    $addFields: {
      lineValue: {
        $round: [
          {
            $multiply: [
              "$Details.UnitPrice",
              "$Details.Quantity",
              { $subtract: [1, "$Details.Discount"] }
            ]
          },
          2
        ]
      }
    }
  },

  // wybór potrzebnych trybótów
  {
    $project: {
      CustomerID: 1,
      OrderDate: 1,
      lineValue: 1,
      Year: { $year: "$OrderDate" },
      Month: { $month: "$OrderDate" }
    }
  },

  // Suma wartości dla klienta-roku-miesiąc - tu niestety nie dało się użyć $first
  {
    $group: {
      _id: {
        CustomerID: "$CustomerID",
        Year: "$Year",
        Month: "$Month"
      },
      TotalSales: { $sum: "$lineValue" }
    }
  },

  // dołączenie informacji o kliencie, potrzebne do company name
  {
    $lookup: {
      from: "customers",
      localField: "_id.CustomerID",
      foreignField: "CustomerID",
      as: "Cust"
    }
  },
  { $unwind: "$Cust" },

  // wybór i przerzutowanie pól z $_id do pól z wartościami
  {
    $project: {
      CustomerID: "$_id.CustomerID",
      CompanyName: "$Cust.CompanyName",
      Year: "$_id.Year",
      Month: "$_id.Month",
      TotalSales: 1
    }
  },

  // grupowanie wyników po kliencie
  {
    $group: {
      _id: "$CustomerID",
      CompanyName: { $first: "$CompanyName" },
      Sale: {
        $push: {
          Year: "$Year",
          Month: "$Month",
          TotalSales: "$TotalSales"
        }
      }
    }
  },

  {
    $project: {
      _id: 1,
      CustomerID: "$_id",
      CompanyName: 1,
      Sale: 1
    }
  }
]);

// Zadanie 4 - OrdersInfo
use('b');
db.OrdersInfo.aggregate([
  // rozwijanie dokumentów, ponieważ będzie następowało grupowanie po ich atrybutach (miesiac, rok)
  { $unwind: "$Orderdetails" },

  // wybór potrzebnych atrybutów 
  {
    $project: {
      CustomerID: "$Customer.CustomerID",
      CompanyName: "$Customer.CompanyName",
      Value: "$Orderdetails.Value",
      Year: { $year: "$Dates.OrderDate" },
      Month: { $month: "$Dates.OrderDate" }
    }
  },

  // Suma wartości dla klienta-roku-miesiąc - tu niestety nie dało się użyć $first
  {
    $group: {
      _id: {
        CustomerID: "$CustomerID",
        Year: "$Year",
        Month: "$Month"
      },
      CompanyName: { $first: "$CompanyName" },
      TotalSales: { $sum: "$Value" }
    }
  },

  // wybór i przerzutowanie pól z $_id do pól z wartościami
  {
    $project: {
      CustomerID: "$_id.CustomerID",
      Year: "$_id.Year",
      Month: "$_id.Month",
      TotalSales: 1,
      CompanyName: 1
    }
  },

  // grupowanie po kliencie
  {
    $group: {
      _id: "$CustomerID",
      CompanyName: { $first: "$CompanyName" },
      Sale: {
        $push: {
          Year: "$Year",
          Month: "$Month",
          TotalSales: "$TotalSales"
        }
      }
    }
  },

  {
    $project: {
      _id: 1,
      CustomerID: "$_id",
      CompanyName: 1,
      Sale: 1,
    }
  }
]);

// Zadanie 4 - CustomerInfo
use('b');
db.CustomerInfo.aggregate([
  // rozwinięcie, listy dokumentów orders, ponieważ chcemy grupować bo ich atrybutach
  { $unwind: "$Orders" },

  // wybór i oznaczenie potrzebnych atrybutów
  {
    $project: {
      CustomerID: "$CustomerID",
      CompanyName: "$CompanyName",
      OrderValue: "$Orders.OrderTotal",
      Year: { $year: "$Orders.Dates.OrderDate" },
      Month: { $month: "$Orders.Dates.OrderDate" }
    }
  },

  // Suma wartości dla klienta-roku-miesiąc - tu niestety nie dało się użyć $first
  {
    $group: {
      _id: {
        CustomerID: "$CustomerID",
        Year: "$Year",
        Month: "$Month"
      },
      TotalSales: { $sum: "$OrderValue" },
      CompanyName: { $first: "$CompanyName"}
    }
  },

  // wybór i przerzutowanie pól z $_id do pól z wartościami
  {
    $project: {
      CustomerID: "$_id.CustomerID",
      CompanyName: 1,
      Year: "$_id.Year",
      Month: "$_id.Month",
      TotalSales: 1
    }
  },

  // grupowanie wyników po kliencie
  {
    $group: {
      _id: "$CustomerID",
      CompanyName: { $first: "$CompanyName" },
      SalesByPeriod: {
        $push: {
          Year: "$Year",
          Month: "$Month",
          TotalSales: "$TotalSales"
        }
      }
    }
  },

  {
    $project: {
      _id: 1,
      CustomerID: "$_id",
      CompanyName: 1,
      SalesByPeriod: 1
    }
  }
]);
