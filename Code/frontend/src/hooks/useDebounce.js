// Custom hook for delaying a changing value in the Ask Docs AI frontend.

//  * It is mainly used for search inputs so API calls do not happen on every key press.


import { useState, useEffect } from "react";

/**
 * Debounce a value by a delay in ms
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
