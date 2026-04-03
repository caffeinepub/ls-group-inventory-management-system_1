# LS Group Inventory Management System

## Current State
- Change Log tab has 2 sub-tabs: Inventory and Bardana, each with 5-day rolling history, color-coded, with horizontal/vertical scrollbars.
- Orders tab supports full order creation (date, orderedBags, brand, rate, partyName, dalalName/broker, category) and delivery rows per order (deliveredBags, date, brand, remarks).
- Raw Materials tab has columns: #, Product, Current Stock, Edit Stock (input appears inline), Action (Edit button), Order (up/down), Delete (admin only). Stock edits require clicking Edit button first, then using a separate input column.
- DataStoreContext manages all backend state. The backend uses stable JSON variables for all data fields.

## Requested Changes (Diff)

### Add
- Orders change log: new sub-tab in Change Log tab (green-coded), placed after Inventory and Bardana.
  - Logged on order creation: captures date (timestamp), order date, ordered bags, brand, party name, rate (qtl), broker, qty change (positive = ordered bags), user ID.
  - Logged on delivery: captures same fields from the parent order, qty change = negative of delivered bags.
  - Columns: Date, Order Date, Ordered Bags, Brand, Party Name, Rate(Qtl), Broker, Qty Change, User ID.
  - 5-day rolling retention (same as Inventory and Bardana logs).
- New `OrderLogEntry` type in DataStoreContext.
- New `changeLogOrders` state + `updateChangeLogOrders` updater in DataStoreContext.
- New stable var `changeLogOrdersJson` in Motoko backend, included in `getAllData()` tuple (becomes 11-tuple).
- New backend methods: `getChangeLogOrders()` / `setChangeLogOrders()`.
- New `logOrderChange()` function in `useChangeLog` hook.
- `Unit` column in Raw Materials tab (editable text field, persisted per product per plant).
- New `units` field in RawMaterials plant data (Record<string, string>) in DataStoreContext.

### Modify
- `getAllData()` in backend now returns 11-tuple (adds changeLogOrders at index 10).
- `backend.d.ts` updated with new methods and 11-tuple return.
- DataStoreContext: add field index 10 for changeLogOrders, add `changeLogOrders` + `updateChangeLogOrders`, extend `applyAllData` to parse index 10.
- `useChangeLog` hook: add `logOrderChange`, `getOrderLog` functions.
- `ChangeLogTab`: add Orders sub-tab with green color-coding, columns as specified.
- `OrdersTab`: call `logOrderChange` on order creation and on each delivery added.
- `RawMaterialsTab` PlantRawMaterials:
  - Current Stock cell becomes directly inline-editable (click to edit value, press Enter or click ✓ to save).
  - Remove "Edit Stock" column entirely.
  - Remove "Action" column entirely.
  - Add "Unit" column after Current Stock — editable text input, persists per product.
- `RawMaterialsTab` ConsolidatedRawMaterials: add Unit column (shows LS Pulses unit as reference, or blank if inconsistent).
- `useRawMaterialsStore` hook / `useInventoryStore.ts`: add `setUnit`, `getUnit` functions backed by DataStoreContext `rawMaterialsData` (store units in a separate `units` sub-key per plant data).

### Remove
- "Edit Stock" column from Raw Materials PlantRawMaterials table.
- "Action" column from Raw Materials PlantRawMaterials table.

## Implementation Plan
1. Update Motoko backend: add `changeLogOrdersJson` stable var, `getChangeLogOrders`/`setChangeLogOrders` methods, extend `getAllData` to 11-tuple.
2. Update `backend.d.ts`: new methods, 11-tuple.
3. Update `DataStoreContext`: new type `OrderLogEntry`, new state/updater, extend `applyAllData`, add field index 10.
4. Update `useChangeLog`: add `logOrderChange`/`getOrderLog`.
5. Update `useInventoryStore` (raw materials): add unit storage/retrieval in PlantData (using `rawMaterialsData` with a `units` map per plant).
6. Update `OrdersTab`: call `logOrderChange` after `addOrder` and after `addDelivery`.
7. Update `ChangeLogTab`: add Orders sub-tab.
8. Update `RawMaterialsTab`: inline-editable stock, remove Edit Stock/Action columns, add Unit column.
