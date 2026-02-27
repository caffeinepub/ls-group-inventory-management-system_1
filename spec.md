# Specification

## Summary
**Goal:** Fix the stock addition bug in the Inventory tab where the product ID is not correctly passed to the backend, causing a "Failed to add stock - product not found or invalid quantity" error.

**Planned changes:**
- Fix the stock addition logic so the correct product ID from the selected row is passed to the `addStock` mutation when the Add button is clicked.
- Ensure the fix applies to all products across both LS Pulses and LS Foods LLP plant sub-tabs.

**User-visible outcome:** Users can enter a positive whole-number quantity for any product in the Inventory tab and click Add without encountering an error. The updated stock value is reflected in the inventory table immediately after a successful addition.
