import React, { useEffect, useState } from 'react';
import { getUserBonus } from '../api'; // Use the API module instead of direct axios
import Header from '../components/Header';

export default function UserDashboard() {
  const [bonus, setBonus] = useState(0);

  useEffect(() => {
    async function fetchBonus() {
      try {
        const res = await getUserBonus(); // Use the API module function
        setBonus(res.data.totalBonus || 0);
      } catch (error) {
        console.error(error);
      }
    }
    fetchBonus();
  }, []);

  return (
    <div>
      <Header />
      {/* your dashboard UI ... */}
      <p>Your referral bonus: {bonus} RWF</p>
    </div>
  );
}
