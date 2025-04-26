import { useState, useEffect } from "react";

export function useErrorState(initialError: string = "") {
  const [error, setError] = useState(initialError);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  return [error, setError] as const;
}
