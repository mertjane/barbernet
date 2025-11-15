import { JobFilters, JobListing } from "@/lib/jobs-store";
import axiosInstance from "@/services/axiosInstance";

// ===========================
// API Functions
// ===========================

/**
 * Fetch all jobs
 */
export const getAllJobs = async (): Promise<JobListing[]> => {
  const { data } = await axiosInstance.get<JobListing[]>("/jobs");
  return data;
};

/**
 * Fetch jobs with optional filters 
 */
export const getJobs = async (filters?: JobFilters): Promise<JobListing[]> => {
  const params: Record<string, string> = {};
  if (filters?.location) params.location = filters.location;
  if (filters?.type) params.type = filters.type;
  
  const { data } = await axiosInstance.get<JobListing[]>("/jobs/list", { params });
  return data;
};

/**
 * Fetch a single job by ID
 */
export const getJobById = async (id: string): Promise<JobListing> => {
  const { data } = await axiosInstance.get<JobListing>(`/jobs/${id}`);
  return data;
};

/**
 * Create a new job
 */
export const createJob = async (job: Omit<JobListing, "id" | "created_at" | "updated_at">): Promise<JobListing> => {
  console.log('Creating job with payload:', job);
  const { data } = await axiosInstance.post<JobListing>("/jobs/new-job", job);
  return data;
};

/**
 * Update an existing job (owner only)
 */
export const updateJob = async (
  id: string,
  owner_id: string,
  updates: Partial<Omit<JobListing, "id" | "owner_id" | "created_at" | "updated_at">>
): Promise<JobListing> => {
  const { data } = await axiosInstance.put<JobListing>(`/jobs/update/${id}`, { 
    ...updates, 
    owner_id 
  });
  return data;
};

/**
 * Delete a job (owner only)
 */
export const deleteJob = async (id: string, owner_id: string): Promise<{ message: string; job: JobListing }> => {
  const { data } = await axiosInstance.delete<{ message: string; job: JobListing }>(`/jobs/delete/${id}`, {
    data: { owner_id },
  });
  return data;
};