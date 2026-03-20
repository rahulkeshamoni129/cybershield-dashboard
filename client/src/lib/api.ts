/**
 * Shared API fetcher that handles:
 * 1. Bearer Token injection
 * 2. 401 Unauthorized globally (triggers logout in AuthContext)
 * 3. Base URL management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
}

export const fetchWithAuth = async (endpoint: string, options: FetchOptions = {}) => {
    const token = localStorage.getItem('token');
    
    // 1. Build Headers
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    // 2. Build URL with Params
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    if (options.params) {
        const searchParams = new URLSearchParams(options.params);
        url += `?${searchParams.toString()}`;
    }

    // 3. Execute Fetch
    try {
        const response = await fetch(url, { ...options, headers });

        // 4. Global 401 Handling
        if (response.status === 401) {
            console.warn('Unauthorized request detected. Dispatching logout event...');
            window.dispatchEvent(new Event('auth-unauthorized'));
        }

        return response;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
};

export default fetchWithAuth;
