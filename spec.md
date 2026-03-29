# LS Group Inventory Management System

## Current State
All data (inventory, bardana, orders, tools, raw materials, change log, transaction log, users) is stored in browser localStorage. Data is isolated per device/browser. Multiple users cannot see each other's data. Backend (main.mo) exists but uses non-stable Map/List variables that reset on canister upgrade, making it unusable.

## Requested Changes (Diff)

### Add
- Stable Motoko backend that persists all app data across upgrades and reconnects
- Backend stores: inventory stocks, bardana data (initial stock, stockInWH, addedBardana, accumulatedInventory), orders with deliveries, tools, raw materials, change log (inventory + bardana), transaction log, users list, custom products, deleted builtins, product order
- Frontend polling every 10 seconds to sync data from backend across all connected devices
- Backend sync layer in frontend that replaces localStorage reads/writes with backend calls

### Modify
- Replace main.mo with a stable-variable-based implementation using Text JSON blobs per data category (no HashMap, no List, no non-stable variables)
- All localStorage hooks (useInventoryStore, useBardanaCalculations, useOrdersStore, useToolsStore, useChangeLog, useTransactionLog, AuthContext) to read/write from backend instead of localStorage
- App initializes by loading data from backend on first mount; polling keeps data fresh

### Remove
- All localStorage reads/writes for shared data (inventory, bardana, orders, tools, raw materials, change log, transaction log)
- Users list from localStorage (moved to backend)
- Non-stable backend code

## Implementation Plan

1. **Backend (main.mo)**: Rewrite with stable var Text fields for each data category. Each field stores the full JSON blob for that category. API: getter/setter per category. No complex types, no Maps, no Lists - just stable Text.
   - `stable var inventoryJson : Text` - stores `{[plant]: {products: [{name, qty}], customProducts, deletedBuiltins, productOrder}}`
   - `stable var bardanaJson : Text` - stores bardana calc data
   - `stable var ordersJson : Text` - stores orders array
   - `stable var toolsJson : Text` - stores tools array
   - `stable var rawMaterialsJson : Text` - stores raw materials
   - `stable var changeLogInventoryJson : Text` - stores inventory change log
   - `stable var changeLogBardanaJson : Text` - stores bardana change log
   - `stable var transactionLogJson : Text` - stores daily transaction log
   - `stable var usersJson : Text` - stores users list

2. **Frontend sync layer**: Create a `useBackendStore` hook that:
   - On mount: loads all data from backend, stores in React state, also writes to localStorage as cache
   - Every 10 seconds: fetches all data from backend, updates state if changed
   - On any write: immediately updates backend + local state
   - All existing hooks delegate to this layer

3. **AuthContext**: Read users from backend on mount; write back on any change

4. All tab components remain unchanged - they use the same hook APIs, only the underlying storage changes
