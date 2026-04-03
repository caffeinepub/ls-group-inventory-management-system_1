# LS Group Inventory Management System

## Current State
The app is a full-stack ICP app with a React frontend and Motoko backend. It manages inventory, bardana, orders, tools & machinery, raw materials, and a change log for LS Group (LS Pulses and LS Foods LLP plants). Role-based access (Admin/Staff) is enforced. Orders have Active/Completed sections with delivery tracking. Brand and Broker dropdowns use hardcoded lists. Bardana current stock is calculated as: Initial Stock + Added Bardana - Accumulated Inventory (where inventory additions for matching products reduce bardana current stock). Currently, Tiranga Kutta and Tiranga Jarda in inventory are handled separately; Tiranga(K) and Tiranga(J) are the brand names in Orders.

## Requested Changes (Diff)

### Add
- **Change Password (User Management):** Admin-only button per user (including Admins and Staff) in UserManagementTab to change password. Dialog prompts for new password and confirmation.
- **Orders Dal/Cattle Feed tabs:** Under both Active Orders and Completed Orders views, add two sub-tabs: "Dal" and "Cattle Feed" to filter/separate orders by category. Each order will have a category field (Dal or Cattle Feed). New orders get a category selector when creating.
- **Orders Left tab:** A third top-level tab next to Active Orders and Completed Orders. Shows a summary per broker of: total remaining bags across all active orders, broken down by brand/variety. Sorted descending by total remaining bags.
- **Editable dropdown lists for Brand and Broker:** A manage button next to each dropdown in the order creation form to add, edit, or delete items in the Brand and Broker lists. Lists persist via DataStoreContext (new fields: customBrands and customBrokers, stored in backend).

### Modify
- **Brand names in Orders:** Rename "Tiranga(K)" to "Tiranga Kutta" and "Tiranga(J)" to "Tiranga Jarda" in default Brand dropdown list and in OrdersTab display.
- **Bardana current stock calculation:** When inventory is added for "Tiranga Kutta" OR "Tiranga Jarda", both quantities should accumulate into the Bardana "Tiranga" product's accumulatedInventory. Update `inventoryToBardanaProduct()` in useInventoryStore.ts to map both "Tiranga Kutta" → "Tiranga" and "Tiranga Jarda" → "Tiranga".
- **DataStoreContext:** Add `customBrands` and `customBrokers` fields for persisting editable dropdown lists. Add `orderListsData` to stored fields and backend.
- **Backend:** Add getOrderLists/setOrderLists methods (or use a new JSON field in existing storage).

### Remove
- Nothing removed.

## Implementation Plan

1. **DataStoreContext:** Add `orderListsData` state (contains `{ customBrands: string[], customBrokers: string[] }`), with updateOrderListsData, persisted via a new backend field. Need to update backend.d.ts and add field index. OR re-use existing field by piggy-backing on orders data. Simplest: store lists as a separate JSON field in backend (getOrderLists/setOrderLists).

   Actually simpler: store the editable lists inside ordersData or as a separate key. Best approach: add a new field `orderListsData` to DataStoreContext and backend.

2. **useInventoryStore.ts:** Update `inventoryToBardanaProduct()` to return "Tiranga" for both "Tiranga Kutta" and "Tiranga Jarda".

3. **UserManagementTab.tsx:** Add change password button per user row. Dialog with new password + confirm. On save, update user in users array.

4. **OrdersTab.tsx:**
   - Rename "Tiranga(K)" → "Tiranga Kutta" and "Tiranga(J)" → "Tiranga Jarda" in default brand list.
   - Add `category` field ("Dal" | "Cattle Feed") to OrderRecord type.
   - Add category selector in new order creation form.
   - Add Dal/Cattle Feed sub-tabs under Active Orders and Completed Orders.
   - Add "Orders Left" as a third top-level section/tab, showing per-broker remaining bags summary, sorted descending.
   - Add manage (edit/add/delete) buttons for Brand and Broker lists, with dialog UI.

5. **Backend:** Add getOrderLists/setOrderLists to main.mo and backend.d.ts declarations.

6. **Validate and deploy.**
