"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { loginUser, getUserOrganizations, type AuthUser, type IamOrganization } from "./auth-api";
import { setAuthToken } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  /** All IAM organisations this user belongs to. */
  organizations: IamOrganization[];
  /**
   * The IAM organisation IDs that map to Tenants in the incidents system.
   * Use this set to filter incidents by iamOrganizationId.
   * Empty set = no restriction (superadmin / not yet resolved).
   */
  tenantOrgIds: Set<string>;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  organizations: [],
  tenantOrgIds: new Set(),
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

const TOKEN_KEY = "tippov_token";
const USER_KEY  = "tippov_user";
const ORGS_KEY  = "tippov_orgs";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]               = useState<string | null>(null);
  const [user, setUser]                 = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<IamOrganization[]>([]);
  const [isLoading, setIsLoading]       = useState(true);

  // Restore session from localStorage on first render
  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const u = localStorage.getItem(USER_KEY);
      const o = localStorage.getItem(ORGS_KEY);
      if (t && u) {
        const parsedUser: AuthUser = JSON.parse(u);
        const parsedOrgs: IamOrganization[] = o ? JSON.parse(o) : [];
        setToken(t);
        setUser(parsedUser);
        setOrganizations(parsedOrgs);
        setAuthToken(t); // keep api.ts module in sync
      }
    } catch {
      // corrupted storage — start fresh
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ORGS_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: t, user: u } = await loginUser(email, password);
    const orgs = await getUserOrganizations(u.id, t);
    setToken(t);
    setUser(u);
    setOrganizations(orgs);
    setAuthToken(t);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORGS_KEY);
  }, []);

  // Derive the set of IAM org IDs that are Tenants for this user.
  // All the user's orgs are candidates — the incidents API uses iamOrganizationId
  // to link an incident to an IAM org. We expose the full set so the dashboard
  // can filter incidents accordingly.
  const tenantOrgIds = new Set(organizations.map((o) => o.id));

  return (
    <AuthContext.Provider
      value={{ token, user, organizations, tenantOrgIds, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}
