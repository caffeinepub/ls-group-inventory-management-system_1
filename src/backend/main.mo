import Map "mo:core/Map";
import List "mo:core/List";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";

actor {
  // ── Legacy type definitions kept for upgrade compatibility ──────────────────────
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

  // ── Legacy variables kept for upgrade compatibility (do not remove) ───────────
  var nextOrderId : Nat = 0;
  var nextChangeLogId : Nat = 0;
  let inventory = Map.empty<Text, InventoryEntry>();
  let bardana = Map.empty<Text, BardanaEntry>();
  let orders = Map.empty<Nat, OrderEntry>();
  let toolsMachinery = List.empty<ToolMachinery>();
  let rawMaterials = Map.empty<Text, RawMaterialEntry>();
  let changeLog = Map.empty<Nat, ChangeLog>();

  // ── Stable JSON storage ─────────────────────────────────────────────────────
  stable var inventoryJson : Text = "{}";
  stable var bardanaJson : Text = "{}";
  stable var ordersJson : Text = "[]";
  stable var toolsJson : Text = "[]";
  stable var rawMaterialsJson : Text = "{}";
  stable var changeLogInventoryJson : Text = "[]";
  stable var changeLogBardanaJson : Text = "[]";
  stable var transactionLogJson : Text = "[]";
  stable var usersJson : Text = "[]";
  stable var orderListsJson : Text = "{}";

  // ── Public API ───────────────────────────────────────────────────────────────
  public query func getInventory() : async Text { inventoryJson };
  public func setInventory(data : Text) : async () { inventoryJson := data };

  public query func getBardana() : async Text { bardanaJson };
  public func setBardana(data : Text) : async () { bardanaJson := data };

  public query func getOrders() : async Text { ordersJson };
  public func setOrders(data : Text) : async () { ordersJson := data };

  public query func getTools() : async Text { toolsJson };
  public func setTools(data : Text) : async () { toolsJson := data };

  public query func getRawMaterials() : async Text { rawMaterialsJson };
  public func setRawMaterials(data : Text) : async () { rawMaterialsJson := data };

  public query func getChangeLogInventory() : async Text { changeLogInventoryJson };
  public func setChangeLogInventory(data : Text) : async () { changeLogInventoryJson := data };

  public query func getChangeLogBardana() : async Text { changeLogBardanaJson };
  public func setChangeLogBardana(data : Text) : async () { changeLogBardanaJson := data };

  public query func getTransactionLog() : async Text { transactionLogJson };
  public func setTransactionLog(data : Text) : async () { transactionLogJson := data };

  public query func getUsers() : async Text { usersJson };
  public func setUsers(data : Text) : async () { usersJson := data };

  public query func getOrderLists() : async Text { orderListsJson };
  public func setOrderLists(data : Text) : async () { orderListsJson := data };

  public query func getAllData() : async (Text, Text, Text, Text, Text, Text, Text, Text, Text, Text) {
    (
      inventoryJson,
      bardanaJson,
      ordersJson,
      toolsJson,
      rawMaterialsJson,
      changeLogInventoryJson,
      changeLogBardanaJson,
      transactionLogJson,
      usersJson,
      orderListsJson,
    );
  };
};
