import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";

actor {
  type Product = {
    name : Text;
    var quantity : Float;
  };

  type InventoryEntry = {
    plant : Text;
    products : List.List<Product>;
  };

  type BardanaEntry = InventoryEntry;
  type OrderEntry = {
    id : Nat;
    var date : Time.Time;
    brand : Text;
    var bags : Int;
    var rate : Float;
    var partyName : Text;
    var dalalName : Text;
    var remarks : Text;
  };

  type ToolMachinery = {
    product : Text;
    var quantity : Int;
    var remarks : Text;
  };

  type RawMaterialEntry = InventoryEntry;
  type ChangeLog = {
    timestamp : Time.Time;
    plant : Text;
    product : Text;
    quantityChange : Int;
    user : Text;
  };

  type InventoryView = {
    plant : Text;
    products : [ProductView];
  };
  type ProductView = {
    name : Text;
    quantity : Float;
  };

  type BardanaView = {
    plant : Text;
    products : [ProductView];
  };

  type OrderView = {
    id : Nat;
    date : Time.Time;
    brand : Text;
    bags : Int;
    rate : Float;
    partyName : Text;
    dalalName : Text;
    remarks : Text;
  };

  type ToolMachineryView = {
    product : Text;
    quantity : Int;
    remarks : Text;
  };

  type RawMaterialView = {
    plant : Text;
    products : [ProductView];
  };

  var nextOrderId = 0;
  var nextChangeLogId = 0;

  let inventory = Map.empty<Text, InventoryEntry>();
  let bardana = Map.empty<Text, BardanaEntry>();
  let orders = Map.empty<Nat, OrderEntry>();
  let toolsMachinery = List.empty<ToolMachinery>();
  let rawMaterials = Map.empty<Text, RawMaterialEntry>();
  let changeLog = Map.empty<Nat, ChangeLog>();

  func compareProductsByQuantity(a : Product, b : Product) : Order.Order {
    Float.compare(b.quantity, a.quantity);
  };

  public shared ({ caller }) func addInventoryStock(plant : Text, productName : Text, quantity : Int, user : Text) : async Bool {
    if (quantity <= 0) { return false };
    switch (inventory.get(plant)) {
      case (null) { false };
      case (?entry) {
        let productsArray = entry.products.toArray();
        var productFound : ?Product = null;

        let updatedProducts = List.fromArray<Product>(
          productsArray.map(func(p) { if (p.name == productName) { productFound := ?p; p } else { p } })
        );

        switch (productFound) {
          case (null) { false };
          case (?product) {
            product.quantity += quantity.toFloat();
            entry.products.clear();
            entry.products.addAll(updatedProducts.values());
            addChangeLog(plant, productName, quantity, user);
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeInventoryStock(plant : Text, productName : Text, quantity : Int, user : Text) : async Bool {
    if (quantity <= 0) { return false };
    switch (inventory.get(plant)) {
      case (null) { false };
      case (?entry) {
        let productsArray = entry.products.toArray();
        var productFound : ?Product = null;

        let updatedProducts = List.fromArray<Product>(
          productsArray.map(func(p) { if (p.name == productName) { productFound := ?p; p } else { p } })
        );

        switch (productFound) {
          case (null) { false };
          case (?product) {
            if (product.quantity < quantity.toFloat()) { false } else {
              product.quantity -= quantity.toFloat();
              entry.products.clear();
              entry.products.addAll(updatedProducts.values());
              addChangeLog(plant, productName, -quantity, user);
              true;
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func setBardanaStock(plant : Text, productName : Text, quantity : Float) : async Bool {
    if (quantity < 0) { return false };
    switch (bardana.get(plant)) {
      case (null) { false };
      case (?entry) {
        let productsArray = entry.products.toArray();
        var productFound : ?Product = null;

        let updatedProducts = List.fromArray<Product>(
          productsArray.map(func(p) { if (p.name == productName) { productFound := ?p; p } else { p } })
        );

        switch (productFound) {
          case (null) { false };
          case (?product) {
            product.quantity := quantity;
            entry.products.clear();
            entry.products.addAll(updatedProducts.values());
            true;
          };
        };
      };
    };
  };

  public shared ({ caller }) func addOrder(
    date : Time.Time,
    brand : Text,
    bags : Int,
    rate : Float,
    partyName : Text,
    dalalName : Text,
    remarks : Text,
  ) : async Nat {
    orders.add(nextOrderId, {
      id = nextOrderId;
      var date;
      brand;
      var bags;
      var rate;
      var partyName;
      var dalalName;
      var remarks;
    });
    let orderId = nextOrderId;
    nextOrderId += 1;
    orderId;
  };

  public shared ({ caller }) func updateOrder(
    orderId : Nat,
    date : Time.Time,
    bags : Int,
    rate : Float,
    partyName : Text,
    dalalName : Text,
    remarks : Text,
  ) : async Bool {
    switch (orders.get(orderId)) {
      case (null) { false };
      case (?order) {
        order.date := date;
        order.bags := bags;
        order.rate := rate;
        order.partyName := partyName;
        order.dalalName := dalalName;
        order.remarks := remarks;
        true;
      };
    };
  };

  public shared ({ caller }) func deleteOrder(orderId : Nat) : async () {
    orders.remove(orderId);
  };

  public shared ({ caller }) func addToolMachinery(product : Text, quantity : Int, remarks : Text) : async () {
    let toolMachinery = { product; var quantity; var remarks };
    toolsMachinery.add(toolMachinery);
  };

  public shared ({ caller }) func updateToolMachinery(index : Nat, quantity : Int, remarks : Text) : async Bool {
    if (index >= toolsMachinery.size()) { return false };
    let tool = toolsMachinery.at(index);
    tool.quantity := quantity;
    tool.remarks := remarks;
    true;
  };

  public shared ({ caller }) func deleteToolMachinery(index : Nat) : async () {
    if (index >= toolsMachinery.size()) { return () };
    var newTools = List.empty<ToolMachinery>();
    var currentIndex = 0;
    while (currentIndex < toolsMachinery.size()) {
      if (currentIndex != index) {
        newTools.add(toolsMachinery.at(currentIndex));
      };
      currentIndex += 1;
    };
    toolsMachinery.clear();
    toolsMachinery.addAll(newTools.values());
  };

  public shared ({ caller }) func setRawMaterialStock(plant : Text, productName : Text, quantity : Float) : async Bool {
    if (quantity < 0) { return false };
    switch (rawMaterials.get(plant)) {
      case (null) { false };
      case (?entry) {
        let productsArray = entry.products.toArray();
        var productFound : ?Product = null;

        let updatedProducts = List.fromArray<Product>(
          productsArray.map(func(p) { if (p.name == productName) { productFound := ?p; p } else { p } })
        );

        switch (productFound) {
          case (null) { false };
          case (?product) {
            product.quantity := quantity;
            entry.products.clear();
            entry.products.addAll(updatedProducts.values());
            true;
          };
        };
      };
    };
  };

  func addChangeLog(plant : Text, product : Text, quantityChange : Int, user : Text) {
    let logEntry = {
      timestamp = Time.now();
      plant;
      product;
      quantityChange;
      user;
    };

    let threeDaysAgo = Time.now() - (3 * 24 * 60 * 60 * 1_000_000_000);

    var newEntries : [(Nat, ChangeLog)] = [];
    for ((id, entry) in changeLog.entries()) {
      if (entry.timestamp >= threeDaysAgo) {
        newEntries := newEntries.concat([(id, entry)]);
      };
    };

    changeLog.clear();
    for ((id, entry) in newEntries.values()) {
      changeLog.add(id, entry);
    };

    changeLog.add(nextChangeLogId, logEntry);
    nextChangeLogId += 1;
  };

  func mapProductsToView(products : List.List<Product>) : [ProductView] {
    products.toArray().map(func(p) { { name = p.name; quantity = p.quantity } });
  };

  func getInventoryView(entries : Map.Map<Text, InventoryEntry>) : [(Text, InventoryView)] {
    entries.toArray().map(
      func((k, v)) {
        (
          k,
          {
            plant = v.plant;
            products = mapProductsToView(v.products);
          },
        );
      }
    );
  };

  public query ({ caller }) func getInventory() : async [(Text, InventoryView)] {
    getInventoryView(inventory);
  };

  public query ({ caller }) func getBardana() : async [(Text, BardanaView)] {
    getInventoryView(bardana);
  };

  public query ({ caller }) func getOrders() : async [(Nat, OrderView)] {
    orders.toArray().map(
      func((id, o)) {
        (
          id,
          {
            id = id;
            date = o.date;
            brand = o.brand;
            bags = o.bags;
            rate = o.rate;
            partyName = o.partyName;
            dalalName = o.dalalName;
            remarks = o.remarks;
          },
        );
      }
    );
  };

  public query ({ caller }) func getToolsMachinery() : async [ToolMachineryView] {
    toolsMachinery.toArray().map(
      func(t) {
        {
          product = t.product;
          quantity = t.quantity;
          remarks = t.remarks;
        };
      }
    );
  };

  public query ({ caller }) func getRawMaterials() : async [(Text, RawMaterialView)] {
    getInventoryView(rawMaterials);
  };

  public query ({ caller }) func getChangeLog() : async [(Nat, ChangeLog)] {
    changeLog.toArray();
  };

  public query ({ caller }) func getSortedProductsByQuantity(products : [ProductView]) : async [ProductView] {
    products.sort(
      func(a, b) {
        Float.compare(b.quantity, a.quantity);
      }
    );
  };
};
