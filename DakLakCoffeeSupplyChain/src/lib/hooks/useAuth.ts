import { authService } from '../auth/authService';

export function useAuth() {
  if (typeof window === "undefined") return { user: null };

  const user = authService.getUser();
  
  if (!user) return { user: null };

  return {
    user: {
      id: user.id,
      role: user.role,
      roleRaw: user.roleRaw,
      email: user.email,
    },
  };
}
