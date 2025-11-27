import { useEffect, useState } from 'react';

export interface ConnectedUser {
  id: number;
  username: string;
  role: string;
  ipAddress: string;
  deviceInfo: string;
  loginTime: string;
}

export function useConnectedUsers() {
  const [users, setUsers] = useState<ConnectedUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://10.190.50.127:8889/api/users/connected');
        const data = await res.json();
        setUsers(data);
      } catch (e) {
        console.error('Error fetching connected users', e);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  return users;
}