import { useCallback } from "react";

export function useChildAge() {
  const calculateAge = useCallback((birthdate: string | null | undefined): number | null => {
    if (!birthdate) return null;
    const birthDateObj = new Date(birthdate);
    const today = new Date();
    return today.getFullYear() - birthDateObj.getFullYear();
  }, []);

  const displayAge = useCallback(
    (birthdate: string | null | undefined, standard?: string | null): string => {
      if (standard) return standard;
      const age = calculateAge(birthdate);
      return age !== null ? `${age} Yrs` : "N/A";
    },
    [calculateAge]
  );

  return { calculateAge, displayAge };
}
