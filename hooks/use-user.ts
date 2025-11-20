// hooks/useUser.ts
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = Cookies.get("user");
    if (u) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(u));
      } catch {}
    }
  }, []);

  return { user };
}