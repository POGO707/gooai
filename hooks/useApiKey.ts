import { useState, useEffect, useCallback } from 'react';

// FIX: Removed `declare global` for `window.aistudio` to resolve a type conflict with a globally defined type.

export const useApiKey = () => {
    const [isKeySelected, setIsKeySelected] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const checkApiKey = useCallback(async () => {
        setIsChecking(true);
        try {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsKeySelected(hasKey);
            } else {
                // aistudio might not be available in all environments
                setIsKeySelected(false);
            }
        } catch (error) {
            console.error("Error checking for API key:", error);
            setIsKeySelected(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const selectApiKey = useCallback(async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume selection is successful and update state immediately
            // to avoid race conditions with hasSelectedApiKey
            setIsKeySelected(true);
        } else {
            alert("API key selection is not available in this environment.");
        }
    }, []);

    const handleApiError = useCallback((error: any) => {
        if (error?.message?.includes('Requested entity was not found')) {
            setIsKeySelected(false);
        }
    }, []);

    return { isKeySelected, isChecking, selectApiKey, handleApiError, checkApiKey };
};
