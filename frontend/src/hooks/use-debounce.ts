import { useState, useEffect } from "react";

export function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        }
    }, [value, delay]);

   return debouncedValue;
}