import { ShopFilters, ShopListing } from "@/lib/shops-store";
import axiosInstance from "@/services/axiosInstance";

// ===========================
// API Functions
// ===========================

/**
 * Fetch all shops
 */
export const getAllShops = async (): Promise<ShopListing[]> => {
  const { data } = await axiosInstance.get<ShopListing[]>("/shops");
  return data;
};

/**
 * Fetch shops with optional filters 
 */
export const getShops = async (filters?: ShopFilters): Promise<ShopListing[]> => {
  const params: Record<string, string> = {};
  if (filters?.location) params.location = filters.location;
  
  const { data } = await axiosInstance.get<ShopListing[]>("/shops/list", { params });
  return data;
};

/**
 * Fetch a single shop by ID
 */
export const getShopById = async (id: string): Promise<ShopListing> => {
  const { data } = await axiosInstance.get<ShopListing>(`/shops/${id}`);
  return data;
};

/**
 * Create a new shop
 */
export const createShop = async (
  shop: Omit<ShopListing, "id" | "created_at" | "updated_at">
): Promise<ShopListing> => {
  console.log('Creating shop with payload:', shop);
  const { data } = await axiosInstance.post<ShopListing>("/shops/new-shop", shop);
  return data;
};

/**
 * Update an existing shop (owner only)
 */
export const updateShop = async (
  id: string,
  updates: Partial<ShopListing> & { owner_id: string }
): Promise<ShopListing> => {
  const { data } = await axiosInstance.put<ShopListing>(`/shops/update/${id}`, updates);
  return data;
};

/**
 * Delete a shop (owner only)
 */
export const deleteShop = async (
  id: string,
  owner_id: string
): Promise<{ message: string; shop: ShopListing }> => {
  const { data } = await axiosInstance.delete<{ message: string; shop: ShopListing }>(
    `/shops/delete/${id}`,
    {
      data: { owner_id },
    }
  );
  return data;
};