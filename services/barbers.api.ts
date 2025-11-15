import axiosInstance from "@/services/axiosInstance";
import type { BarberProfile, City } from "@/lib/barbers-store";


// ========================================== 
// GET /api/barbers - Fetch all barbers 
// ==========================================
export async function getAllBarbers(): Promise<BarberProfile[]> {
  const response = await axiosInstance.get<BarberProfile[]>("/barbers");
  return response.data;
}

// ==========================================
// GET /api/barbers/list?city= - Fetch barbers by city
// ==========================================
export async function getBarbersByCity(city: City): Promise<BarberProfile[]> {
  const response = await axiosInstance.get<BarberProfile[]>("/barbers/list", {
    params: { city },
  });
  return response.data;
}

// ==========================================
// GET /api/barbers/:id - Fetch single barber by ID
// ==========================================
export async function getBarberById(id: string): Promise<BarberProfile> {
  const response = await axiosInstance.get<BarberProfile>(`/barbers/${id}`);
  return response.data;
}

// ==========================================
// POST /api/barbers/new-barber - Create a new barber
// ==========================================
export async function createBarber(data: {
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
}): Promise<BarberProfile> {
  const response = await axiosInstance.post<BarberProfile>(
    "/barbers/new-barber",
    data
  );
  return response.data;
}

// ==========================================
// PUT /api/barbers/update/:id - Update a barber (owner only)
// ==========================================
export async function updateBarber(
  id: string,
  data: Partial<BarberProfile> & { owner_id: string }
): Promise<BarberProfile> {
  const response = await axiosInstance.put<BarberProfile>(
    `/barbers/update/${id}`,
    data
  );
  return response.data;
}

// ==========================================
// DELETE /api/barbers/delete/:id - Delete barber (owner only)
// ==========================================
export async function deleteBarber(
  id: string,
  owner_id: string
): Promise<{ message: string }> {
  const response = await axiosInstance.delete<{ message: string }>(
    `/barbers/delete/${id}`,
    { data: { owner_id } } // DELETE requires body via axios "data" property
  );
  return response.data;
}
