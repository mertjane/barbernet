import { getAllJobs, createJob as apiCreateJob, updateJob as apiUpdateJob, deleteJob as apiDeleteJob } from "@/services/jobs.api";

// ===========================
// Types
// =========================== 
export type JobType = 
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Temporary"
  | "Rent a Chair";



export interface JobListing {   
  id: string;
  shop_name: string;
  phone_number: string;
  location: string;
  job_type: JobType;
  salary_text: string;
  description: string;
  images?: string[];
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobFilters {
  location?: string;
  type?: JobType;
}

// ===========================
// Jobs Store
// ===========================
let jobs: JobListing[] = [];
const subs = new Set<() => void>();

function emit() { 
  subs.forEach(fn => fn()); 
}

export const jobsStore = {
  get(): JobListing[] { 
    return jobs; 
  },
  
  subscribe(cb: () => void) { 
    subs.add(cb); 
    return () => subs.delete(cb); 
  },
  
  // Get unique locations from loaded jobs
  getUniqueLocations(jobsList: JobListing[] = jobs): string[] {
    const locations = jobsList
      .map(j => j.location)
      .filter((location): location is string => !!location);
    return Array.from(new Set(locations)).sort();
  },
  
  // Get unique job types from loaded jobs
  getUniqueTypes(jobsList: JobListing[] = jobs): JobType[] {
    const types = jobsList
      .map(j => j.job_type)
      .filter((type): type is JobType => !!type);
    return Array.from(new Set(types)).sort();
  },
  
  async loadAll() {
    jobs = await getAllJobs();
    emit();
  },
  
  async add(job: Omit<JobListing, "id" | "created_at" | "updated_at">) {
    const newJob = await apiCreateJob(job);
    jobs = [newJob, ...jobs];
    emit();
    return newJob;
  },
  
  async update(id: string, owner_id: string, patch: Partial<Omit<JobListing, "id" | "owner_id" | "created_at" | "updated_at">>) {
    const updatedJob = await apiUpdateJob(id, owner_id, patch);
    jobs = jobs.map(j => j.id === id ? updatedJob : j);
    emit();
    return updatedJob;
  },
  
  async remove(id: string, owner_id: string) {
    const result = await apiDeleteJob(id, owner_id);
    jobs = jobs.filter(j => j.id !== id);
    emit();
    return result;
  },
  
  filter(filters: JobFilters) {
    return jobs.filter(job => {
      const matchLocation = filters.location 
        ? job.location.toLowerCase().includes(filters.location.toLowerCase())
        : true;
      const matchType = filters.type ? job.job_type === filters.type : true;
      return matchLocation && matchType;
    });
  },
};