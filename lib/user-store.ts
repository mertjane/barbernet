export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo?: { uri: string } | null;
}

let user: UserProfile = {
  id: '',
  name: '',
  phone: '',
  email: '',
  photo: null,
};

const subs = new Set<() => void>();
function emit() { subs.forEach(fn => fn()); }

export const userStore = {
  get(): UserProfile { 
    return user; 
  },
  subscribe(cb: () => void) { subs.add(cb); return () => subs.delete(cb); },
  update(patch: Partial<UserProfile>) { user = { ...user, ...patch }; emit(); },
};
