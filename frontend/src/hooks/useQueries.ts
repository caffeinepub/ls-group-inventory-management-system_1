import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ProductView } from '../backend';

// ─── Inventory ───────────────────────────────────────────────────────────────

export function useGetInventory() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInventory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddInventoryStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plant,
      productName,
      quantity,
      user,
    }: {
      plant: string;
      productName: string;
      quantity: bigint;
      user: string;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      const success = await actor.addInventoryStock(plant, productName, quantity, user);
      if (!success) throw new Error('Failed to add stock — product not found or invalid quantity');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['changelog'] });
    },
  });
}

export function useRemoveInventoryStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plant,
      productName,
      quantity,
      user,
    }: {
      plant: string;
      productName: string;
      quantity: bigint;
      user: string;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      const success = await actor.removeInventoryStock(plant, productName, quantity, user);
      if (!success) throw new Error('Failed to remove stock — insufficient stock or product not found');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['changelog'] });
    },
  });
}

// ─── Bardana ─────────────────────────────────────────────────────────────────

export function useGetBardana() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['bardana'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBardana();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetBardanaStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plant,
      productName,
      quantity,
    }: {
      plant: string;
      productName: string;
      quantity: number;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      const success = await actor.setBardanaStock(plant, productName, quantity);
      if (!success) throw new Error('Failed to update bardana stock — product not found or invalid quantity');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bardana'] });
    },
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export function useGetOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      brand,
      bags,
      rate,
      partyName,
      dalalName,
      remarks,
    }: {
      date: bigint;
      brand: string;
      bags: bigint;
      rate: number;
      partyName: string;
      dalalName: string;
      remarks: string;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addOrder(date, brand, bags, rate, partyName, dalalName, remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      date,
      bags,
      rate,
      partyName,
      dalalName,
      remarks,
    }: {
      orderId: bigint;
      date: bigint;
      bags: bigint;
      rate: number;
      partyName: string;
      dalalName: string;
      remarks: string;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      await actor.updateOrder(orderId, date, bags, rate, partyName, dalalName, remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error('Actor not ready');
      await actor.deleteOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ─── Tools & Machinery ───────────────────────────────────────────────────────

export function useGetToolsMachinery() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getToolsMachinery();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToolMachinery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      product,
      quantity,
      remarks,
    }: {
      product: string;
      quantity: bigint;
      remarks: string;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      await actor.addToolMachinery(product, quantity, remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

export function useUpdateToolMachinery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      index,
      quantity,
      remarks,
    }: {
      index: bigint;
      quantity: bigint;
      remarks: string;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      await actor.updateToolMachinery(index, quantity, remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

export function useDeleteToolMachinery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error('Actor not ready');
      await actor.deleteToolMachinery(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

// ─── Raw Materials ───────────────────────────────────────────────────────────

export function useGetRawMaterials() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['rawmaterials'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRawMaterials();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetRawMaterialStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      plant,
      productName,
      quantity,
    }: {
      plant: string;
      productName: string;
      quantity: number;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      const success = await actor.setRawMaterialStock(plant, productName, quantity);
      if (!success) throw new Error('Failed to update raw material stock — product not found or invalid quantity');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawmaterials'] });
    },
  });
}

// ─── Change Log ──────────────────────────────────────────────────────────────

export function useGetChangeLog() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['changelog'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChangeLog();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Sorted Products ─────────────────────────────────────────────────────────

export function useSortProducts() {
  const { actor } = useActor();
  return async (products: ProductView[]): Promise<ProductView[]> => {
    if (!actor) return products;
    return actor.getSortedProductsByQuantity(products);
  };
}
