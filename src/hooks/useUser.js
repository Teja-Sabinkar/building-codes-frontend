// src/hooks/useUser.js
'use client';

import { useState, useEffect } from 'react';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentUser();
  }, []);

  return { user, loading, error };
}