import { createShop, deleteShop, getAllShops, getShopById, updateShop } from "@/services/shops.api";

// ===========================
// Types
// ===========================
export interface ShopListing {
  id: string;
  shop_name: string;
  sale_price: string;
  location: string;
  info: string;
  phone_number: string;
  images?: string[]; // Array of base64 or URL strings
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShopFilters {
  location?: string;
}

// ===========================
// Store Implementation
// ===========================
const subs = new Set<() => void>();
let shops: ShopListing[] = [];

function emit() {
  subs.forEach((fn) => fn());
}

export const shopsStore = {
  // Get locally cached shops
  get(): ShopListing[] {
    return shops;
  },

  // Subscribe to updates
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => subs.delete(cb);
  },

  // Get unique locations from loaded shops
  getUniqueLocations(shopsList: ShopListing[] = shops): string[] {
    const locations = shopsList
      .map(s => s.location)
      .filter((location): location is string => !!location);
    return Array.from(new Set(locations)).sort();
  },

  // ===========================
  // Load all shops from backend
  // ===========================
  async fetchAll() {
    const data = await getAllShops();
    shops = data;
    emit();
    return data;
  },

  // ===========================
  // Get a specific shop by ID
  // ===========================
  async fetchById(id: string) {
    const shop = await getShopById(id);
    const exists = shops.find((s) => s.id === shop.id);
    if (exists) {
      shops = shops.map((s) => (s.id === shop.id ? shop : s));
    } else {
      shops = [shop, ...shops];
    }
    emit();
    return shop;
  },

  // ===========================
  // Add new shop (create API)
  // ===========================
  async add(input: {
    shop_name: string;
    sale_price: string;
    location: string;
    info: string;
    phone_number: string;
    images?: string[];
    owner_id: string;
  }) {
    const newShop = await createShop(input);
    shops = [newShop, ...shops];
    emit();
    return newShop;
  },

  // ===========================
  // Update shop (via API)
  // ===========================
  async update(id: string, patch: Partial<ShopListing> & { owner_id: string }) {
    const updated = await updateShop(id, patch);
    shops = shops.map((s) => (s.id === id ? updated : s));
    emit();
    return updated;
  },

  // ===========================
  // Delete shop (via API)
  // ===========================
  async remove(id: string, owner_id: string) {
    await deleteShop(id, owner_id);
    shops = shops.filter((s) => s.id !== id);
    emit();
  },

  // ===========================
  // Filter shops locally
  // ===========================
  filter(filters: ShopFilters) {
    return shops.filter(shop => {
      const matchLocation = filters.location 
        ? shop.location.toLowerCase().includes(filters.location.toLowerCase())
        : true;
      return matchLocation;
    });
  },
};