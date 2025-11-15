import axiosInstance from "@/services/axiosInstance";

export const registerUserInDB = async (userData: {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  photo?: string;
}) => {
  const response = await axiosInstance.post("/auth/register", userData);
  console.log(userData)
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await axiosInstance.post("/auth/login", {
    email,
    password,
  });
  console.log(response.data)
  return response.data;
};
