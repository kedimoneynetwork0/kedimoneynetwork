import React, { useState } from 'react';
import { FaTachometerAlt, FaUsers, FaExchangeAlt, FaChartLine, FaCog, FaSignOutAlt, FaBell, FaSearch, FaFilter, FaPlus, FaEye, FaEdit, FaTrash } from 'react-icons/fa';

/**
 * KEDI Business Dashboard Demo
 * Showcases the professional fintech dashboard design
 */
const KediDashboardDemo = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: FaTachometerAlt },
    { id: 'users', label: 'User Management', icon: FaUsers },
    { id: 'transactions', label: 'Transactions', icon: FaExchangeAlt },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  const stats = [
    { title: 'Total Users', value: '2,847', change: '+12.5%', positive: true },
    { title: 'Active Transactions', value: '1,429', change: '+8.2%', positive: true },
    { title: 'Revenue Today', value: '₣847,293', change: '-2.1%', positive: false },
    { title: 'Success Rate', value: '98.7%', change: '+0.3%', positive: true }
  ];

  const recentTransactions = [
    { id: 'TXN-001', user: 'John Doe', type: 'Deposit', amount: '₣50,000', status: 'completed', date: '2024-01-15' },
    { id: 'TXN-002', user: 'Jane Smith', type: 'Withdrawal', amount: '₣25,000', status: 'pending', date: '2024-01-15' },
    { id: 'TXN-003', user: 'Bob Johnson', type: 'Transfer', amount: '₣100,000', status: 'completed', date: '2024-01-14' },
    { id: 'TXN-004', user: 'Alice Brown', type: 'Investment', amount: '₣75,000', status: 'processing', date: '2024-01-14' }
  ];

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">KEDI Business</div>
          <div className="sidebar-subtitle">Fintech Dashboard</div>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-link ${currentSection === item.id ? 'active' : ''}`}
              onClick={() => setCurrentSection(item.id)}
            >
              <span className="sidebar-nav-icon">
                <item.icon />
              </span>
              <span className="sidebar-nav-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn btn-outline w-full"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="navbar-brand">
            <div className="navbar-brand-logo">KEDI</div>
            <span>Business Dashboard</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-welcome">
            Welcome back, Admin
          </div>
          <div className="navbar-actions">
            <button className="btn btn-outline btn-sm">
              <FaBell />
            </button>
            <button className="btn btn-primary btn-sm">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`admin-dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="dashboard-main-content">
          {/* Overview Section */}
          {currentSection === 'overview' && (
            <>
              {/* Welcome Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary mb-2">Dashboard Overview</h1>
                <p className="text-gray-600">Monitor your fintech operations and key metrics</p>
              </div>

              {/* Stats Grid */}
              <div className="dashboard-grid mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="dashboard-card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-primary mb-1">{stat.value}</h3>
                          <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                          <div className={`text-xs font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change} from last month
                          </div>
                        </div>
                        <div className="text-3xl text-primary opacity-20">
                          📊
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Transactions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="card-title">Recent Transactions</h3>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm">
                        <FaFilter />
                      </button>
                      <button className="btn btn-primary btn-sm">
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>User</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((txn) => (
                          <tr key={txn.id}>
                            <td className="font-mono text-sm">{txn.id}</td>
                            <td className="font-medium">{txn.user}</td>
                            <td>{txn.type}</td>
                            <td className="font-semibold text-primary">{txn.amount}</td>
                            <td>
                              <span className={getStatusBadge(txn.status)}>
                                {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                              </span>
                            </td>
                            <td>{txn.date}</td>
                            <td>
                              <div className="flex gap-1">
                                <button className="btn btn-outline btn-sm">
                                  <FaEye />
                                </button>
                                <button className="btn btn-outline btn-sm">
                                  <FaEdit />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Users Section */}
          {currentSection === 'users' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">User Management</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="form-input pl-10 w-64"
                      />
                    </div>
                    <button className="btn btn-outline">
                      <FaFilter className="mr-2" />
                      Filter
                    </button>
                  </div>
                  <button className="btn btn-primary">
                    <FaPlus className="mr-2" />
                    Add User
                  </button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Join Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-medium">John Doe</td>
                        <td>john@example.com</td>
                        <td><span className="badge badge-success">Active</span></td>
                        <td>2024-01-15</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-outline btn-sm">
                              <FaEye />
                            </button>
                            <button className="btn btn-outline btn-sm">
                              <FaEdit />
                            </button>
                            <button className="btn btn-outline btn-sm text-red-600">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="font-medium">Jane Smith</td>
                        <td>jane@example.com</td>
                        <td><span className="badge badge-warning">Pending</span></td>
                        <td>2024-01-14</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-outline btn-sm">
                              <FaEye />
                            </button>
                            <button className="btn btn-outline btn-sm">
                              <FaEdit />
                            </button>
                            <button className="btn btn-outline btn-sm text-red-600">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {currentSection === 'settings' && (
            <div className="space-y-6">
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">System Settings</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Theme</label>
                      <select className="form-select">
                        <option>Light Mode</option>
                        <option>Dark Mode</option>
                        <option>Auto</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Language</label>
                      <select className="form-select">
                        <option>English</option>
                        <option>Kinyarwanda</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Timezone</label>
                      <select className="form-select">
                        <option>UTC+2 (Kigali)</option>
                        <option>UTC+0 (London)</option>
                        <option>UTC-5 (New York)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency</label>
                      <select className="form-select">
                        <option>RWF (Rwandan Franc)</option>
                        <option>USD (US Dollar)</option>
                        <option>EUR (Euro)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button className="btn btn-primary">Save Changes</button>
                    <button className="btn btn-outline">Reset to Default</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default KediDashboardDemo;