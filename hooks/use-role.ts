/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export function useRole(redirectTo: string = "/login") {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        setRole(user.role || null);
      } catch (err) {
        console.error("Error parsing user cookie:", err);
        router.push(redirectTo);
      }
    } else {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);

  return role;
}
