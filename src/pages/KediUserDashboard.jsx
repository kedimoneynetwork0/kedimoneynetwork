import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaTachometerAlt, FaExchangeAlt, FaPiggyBank, FaHistory, FaGift, FaCog, FaSignOutAlt, FaUser, FaWallet, FaMoneyBillWave, FaPlus, FaSyncAlt, FaArrowLeft, FaLeaf } from 'react-icons/fa';

const KediUserDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real app this would come from API
  const [userData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'JD',
    balance: 2450000,
    bonus: 125000
  });

  const [transactions] = useState([
    { id: 1, date: '2025-01-15', type: 'Tree Plan', amount: 500000, status: 'approved', txnId: 'TXN001' },
    { id: 2, date: '2025-01-10', type: 'Savings', amount: 200000, status: 'approved', txnId: 'TXN002' },
    { id: 3, date: '2025-01-08', type: 'Loan', amount: 300000, status: 'pending', txnId: 'TXN003' }
  ]);

  const [stakes] = useState([
    { id: 1, amount: 1000000, duration: 90, rate: 15, startDate: '2025-01-01', endDate: '2025-04-01', status: 'active' },
    { id: 2, amount: 500000, duration: 30, rate: 5, startDate: '2025-01-10', endDate: '2025-02-10', status: 'active' }
  ]);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { id: 'transaction', label: 'Make Transaction', icon: FaExchangeAlt },
    { id: 'stake', label: 'Deposit Stake', icon: FaPiggyBank },
    { id: 'history', label: 'Transaction History', icon: FaHistory },
    { id: 'bonus', label: 'Referral Bonus', icon: FaGift },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const showSection = (section) => {
    setCurrentSection(section);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const goBack = () => {
    setCurrentSection('dashboard');
  };

  const refreshDashboard = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log('Dashboard refreshed');
    }, 1000);
  };

  const logout = () => {
    // Handle logout logic
    console.log('Logout clicked');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Back Arrow */}
      {currentSection !== 'dashboard' && (
        <button
          onClick={goBack}
          className="fixed top-20 left-4 z-50 bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-x-1"
          style={{ background: 'white', border: 'none', cursor: 'pointer' }}
        >
          <FaArrowLeft className="text-green-600" />
        </button>
      )}

      {/* Navbar */}
      <nav className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FaLeaf className="text-2xl" />
            <span className="text-xl font-bold">KEDI BUSINESS & AGRI FUNDS</span>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-semibold">
                {userData.avatar}
              </div>
              <span className="font-medium">{userData.name}</span>
            </div>
            <button
              onClick={logout}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>

          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300"
          >
            {sidebarOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-xl transition-all duration-300 z-30
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        md:translate-x-0
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <h3 className={`text-green-600 font-semibold ${sidebarCollapsed ? 'hidden' : 'block'}`}>Menu</h3>
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:block p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              <FaBars className="text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => showSection(item.id)}
                  className={`
                    w-full flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'justify-start px-4'} py-3 rounded-lg transition-all duration-300
                    ${currentSection === item.id
                      ? 'bg-green-100 text-green-700 border-r-4 border-green-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-green-600'
                    }
                  `}
                >
                  <item.icon className={`${sidebarCollapsed ? 'text-lg' : 'text-lg mr-3'}`} />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`
        transition-all duration-300 pt-16
        ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}
        ${sidebarOpen ? 'ml-0' : 'ml-0'}
      `}>
        {/* Dashboard Section */}
        {currentSection === 'dashboard' && (
          <div className="p-4 md:p-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl shadow-lg mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                    Welcome back, {userData.name}!
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Here's an overview of your account and recent activities.
                  </p>
                </div>
                <button
                  onClick={refreshDashboard}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <FaSyncAlt />
                  )}
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaWallet className="text-2xl" />
                      <span className="text-lg font-medium">Estimated Balance</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {formatCurrency(userData.balance)} RWF
                    </div>
                    <p className="text-green-100 text-sm">
                      Total wallet balance
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <FaGift className="text-2xl" />
                      <span className="text-lg font-medium">Referral Bonus</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {formatCurrency(userData.bonus)} RWF
                    </div>
                    <p className="text-blue-100 text-sm">
                      Total referral earnings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => showSection('transaction')}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  <FaPlus />
                  <span className="font-medium">Make Transaction</span>
                </button>

                <button
                  onClick={() => showSection('stake')}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  <FaPiggyBank />
                  <span className="font-medium">Deposit Stake</span>
                </button>

                <button
                  onClick={() => showSection('history')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  <FaMoneyBillWave />
                  <span className="font-medium">Withdraw</span>
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
                <button
                  onClick={() => showSection('history')}
                  className="text-green-600 hover:text-green-700 font-medium transition-colors duration-300"
                >
                  View All →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 3).map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-3 px-4 text-gray-800">{txn.date}</td>
                        <td className="py-3 px-4 text-gray-800">{txn.type}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{formatCurrency(txn.amount)} RWF</td>
                        <td className="py-3 px-4">{getStatusBadge(txn.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Stakes */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Active Stakes</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Interest Rate</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakes.map((stake) => (
                      <tr key={stake.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-3 px-4 text-gray-800 font-medium">{formatCurrency(stake.amount)} RWF</td>
                        <td className="py-3 px-4 text-gray-800">{stake.duration} days</td>
                        <td className="py-3 px-4 text-gray-800">{stake.rate}%</td>
                        <td className="py-3 px-4 text-gray-800">{stake.startDate}</td>
                        <td className="py-3 px-4 text-gray-800">{stake.endDate}</td>
                        <td className="py-3 px-4">{getStatusBadge(stake.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Section */}
        {currentSection === 'transaction' && (
          <div className="p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Make a Transaction</h2>

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Type
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300">
                      <option value="">Select Type</option>
                      <option value="tree_plan">Tree Plan</option>
                      <option value="loan">Loan</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (RWF)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter transaction ID"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      <FaExchangeAlt />
                      <span>Submit Transaction</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showSection('dashboard')}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Stake Section */}
        {currentSection === 'stake' && (
          <div className="p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Deposit Stake</h2>

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (RWF)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stake Period
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300">
                      <option value="">Select Period</option>
                      <option value="30">30 Days (5% interest)</option>
                      <option value="90">90 Days (15% interest)</option>
                      <option value="180">180 Days (30% interest)</option>
                    </select>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      <FaPiggyBank />
                      <span>Deposit Stake</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showSection('dashboard')}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        {currentSection === 'history' && (
          <div className="p-4 md:p-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-3 px-4 text-gray-800">{txn.date}</td>
                        <td className="py-3 px-4 text-gray-800">{txn.type}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{formatCurrency(txn.amount)} RWF</td>
                        <td className="py-3 px-4 text-gray-800">{txn.txnId}</td>
                        <td className="py-3 px-4">{getStatusBadge(txn.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bonus Section */}
        {currentSection === 'bonus' && (
          <div className="p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="text-6xl text-green-600 mb-6">
                  <FaGift />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Referral Bonus</h2>
                <div className="text-4xl font-bold text-green-600 mb-4">
                  {formatCurrency(userData.bonus)} RWF
                </div>
                <p className="text-gray-600 text-lg">
                  Total referral bonus earned from your network
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <div className="p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="text-6xl text-gray-400 mb-6">
                  <FaCog />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Account Settings</h2>
                <p className="text-gray-600 text-lg">
                  Account settings and preferences will be available here.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default KediUserDashboard;