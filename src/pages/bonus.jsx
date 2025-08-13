import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';

export default function UserDashboard() {
  const [bonus, setBonus] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    async function fetchBonus() {
      try {
        const res = await axios.get('http://localhost:4000/api/user/bonus', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBonus(res.data.totalBonus || 0);
      } catch (error) {
        console.error(error);
      }
    }
    fetchBonus();
  }, [token]);

  return (
    <div>
      <Header />
      {/* your dashboard UI ... */}
      <p>Your referral bonus: {bonus} RWF</p>
    </div>
  );
}
