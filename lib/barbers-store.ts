// ===========================
// Types
// ===========================

import { createBarber, deleteBarber, getAllBarbers, getBarberById, updateBarber } from "@/services/barbers.api";

// ---------------------------
// City type (union)
// ---------------------------
export type City =
  | 'London'
  | 'Manchester'
  | 'Birmingham'
  | 'Liverpool'
  | 'Leeds'
  | 'Sheffield'
  | 'Newcastle'
  | 'Nottingham'
  | 'Bristol'
  | 'Leicester'
  | 'Coventry'
  | 'Sunderland'
  | 'Bradford'
  | 'Hull'
  | 'Stoke-on-Trent'
  | 'Wolverhampton'
  | 'Derby'
  | 'Southampton'
  | 'Portsmouth'
  | 'Plymouth'
  | 'Brighton'
  | 'Reading'
  | 'Milton Keynes'
  | 'Norwich'
  | 'Peterborough'
  | 'Luton'
  | 'Swindon'
  | 'York'
  | 'Blackpool'
  | 'Bolton'
  | 'Middlesbrough'
  | 'Stockport'
  | 'Warrington'
  | 'Huddersfield'
  | 'Preston'
  | 'Bournemouth'
  | 'Ipswich'
  | 'Cambridge'
  | 'Chelmsford'
  | 'Canterbury'
  | 'Exeter'
  | 'Chester';

// ---------------------------
// Runtime array of all cities
// ---------------------------
export const CITIES: City[] = [
  'London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Newcastle', 'Nottingham', 'Bristol',
  'Leicester', 'Coventry', 'Sunderland', 'Bradford', 'Hull', 'Stoke-on-Trent', 'Wolverhampton', 'Derby',
  'Southampton', 'Portsmouth', 'Plymouth', 'Brighton', 'Reading', 'Milton Keynes', 'Norwich', 'Peterborough',
  'Luton', 'Swindon', 'York', 'Blackpool', 'Bolton', 'Middlesbrough', 'Stockport', 'Warrington', 'Huddersfield',
  'Preston', 'Bournemouth', 'Ipswich', 'Cambridge', 'Chelmsford', 'Canterbury', 'Exeter', 'Chester',
];

export interface BarberImage {
  url: string;
}

export interface BarberProfile {
  id: string;
  full_name: string;
  city: City;
  bio?: string;
  phone_number: string;
  email?: string;
  experience: string; // e.g. "0-1 years"
  skills: string[];
  specialities: string[];
  images: string[]; // directly store image URLs for simplicity
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// ===========================
// Store Implementation
// ===========================

const subs = new Set<() => void>();
let barbers: BarberProfile[] = [];

function emit() {
  subs.forEach((fn) => fn());
}

// ===========================
// Store Implementation
// ===========================

export const barbersStore = {
  // Get locally cached barbers
  get(): BarberProfile[] {
    return barbers;
  },

  // Subscribe to updates
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => subs.delete(cb);
  },

  // ===========================
  // Get unique cities from loaded barbers
  // ===========================
  getUniqueCities(barbersList: BarberProfile[] = barbers): City[] {
    const cities = barbersList
      .map(b => b.city)
      .filter((city): city is City => !!city);
    return Array.from(new Set(cities)).sort();
  },

  // ===========================
  // Load all barbers from backend
  // ===========================
  async fetchAll() {
    const data = await getAllBarbers();
    barbers = data;
    emit();
    return data;
  },

  // ===========================
  // Get a specific barber by ID
  // ===========================
  async fetchById(id: string) {
    const barber = await getBarberById(id);
    const exists = barbers.find((b) => b.id === barber.id);
    if (exists) {
      barbers = barbers.map((b) => (b.id === barber.id ? barber : b));
    } else {
      barbers = [barber, ...barbers];
    }
    emit();
    return barber;
  },

  // ===========================
  // Add new barber (create API)
  // ===========================
  async add(input: {
    full_name: string;
    city: City;
    bio?: string;
    phone_number: string;
    email?: string;
    experience: string;
    skills: string[];
    specialities: string[];
    images?: string[];
    owner_id: string;
  }) {
    const newBarber = await createBarber(input);
    barbers = [newBarber, ...barbers];
    emit();
    return newBarber;
  },

  // ===========================
  // Update barber (via API)
  // ===========================
  async update(id: string, patch: Partial<BarberProfile> & { owner_id: string }) {
    const updated = await updateBarber(id, patch);
    barbers = barbers.map((b) => (b.id === id ? updated : b));
    emit();
    return updated;
  },

  // ===========================
  // Delete barber (via API)
  // ===========================
  async remove(id: string, owner_id: string) {
    await deleteBarber(id, owner_id);
    barbers = barbers.filter((b) => b.id !== id);
    emit();
  },
};
