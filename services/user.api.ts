

import axiosInstance from "@/services/axiosInstance";

export interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  photo?: string;
}

export interface UpdateUserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string | null;
}

export async function getUserById(id: string) {
  try {
    const { data } = await axiosInstance.get(`/user/${id}`);
    console.log('getUserById returned:', data); 
    return data;
  } catch (err: any) {
    console.error("Error fetching user:", err);
    throw new Error(err.response?.data?.error || "Failed to fetch user");
  }
}

export async function updateUserApi(user: UpdateUserRequest): Promise<UpdateUserResponse> {
  try {
    const res = await axiosInstance.put(`/user/update`, {
      ...user,
    });

    return res.data as UpdateUserResponse;
  } catch (err: any) {
    console.error("updateUserApi error:", err);
    throw err;
  }
}