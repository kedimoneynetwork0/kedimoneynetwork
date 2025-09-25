import React, { useState, useEffect } from 'react';
import { FaWallet, FaCoins, FaChartLine, FaPiggyBank, FaMoneyBillWave, FaCalculator } from 'react-icons/fa';

const WalletCalculator = ({
  transactions = [],
  stakes = [],
  withdrawals = [],
  bonus = 0,
  realBalance = 0,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    amount: '',
    period: 30,
    type: 'stake'
  });

  // Calculate detailed breakdown
  const calculateBreakdown = () => {
    const approvedTransactions = (Array.isArray(transactions) ? transactions : []).filter(t => t && t.status === 'approved');
    const activeStakes = (Array.isArray(stakes) ? stakes : []).filter(s => s && s.status === 'active');
    const approvedWithdrawals = (Array.isArray(withdrawals) ? withdrawals : []).filter(w => w && w.status === 'approved');

    // Calculate matured stakes with interest
    const maturedStakes = activeStakes.filter(stake => {
      if (!stake || !stake.end_date) return false;
      const currentDate = new Date();
      const endDate = new Date(stake.end_date);
      return currentDate >= endDate;
    });

    const totalDeposits = approvedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalStakePrincipals = activeStakes.reduce((sum, s) => sum + s.amount, 0);
    const totalMaturedInterest = maturedStakes.reduce((sum, s) => sum + (s.amount * s.interest_rate), 0);
    const totalWithdrawals = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    return {
      deposits: totalDeposits,
      stakePrincipals: totalStakePrincipals,
      maturedInterest: totalMaturedInterest,
      withdrawals: totalWithdrawals,
      bonus: bonus,
      netBalance: totalDeposits + totalStakePrincipals + totalMaturedInterest + bonus - totalWithdrawals
    };
  };

  const breakdown = calculateBreakdown();

  // Calculator functions
  const calculateStakeReturn = (amount, period) => {
    const rates = { 30: 0.05, 90: 0.15, 180: 0.30 };
    const rate = rates[period] || 0.05;
    return {
      principal: amount,
      interest: amount * rate,
      total: amount * (1 + rate),
      monthlyReturn: (amount * rate) / (period / 30)
    };
  };

  const calculateSavingsProjection = (amount, months) => {
    const monthlyRate = 0.05 / 12; // 5% annual
    const futureValue = amount * Math.pow(1 + monthlyRate, months);
    return {
      principal: amount,
      interest: futureValue - amount,
      total: futureValue,
      monthlyContribution: amount / months
    };
  };

  const handleCalculatorSubmit = (e) => {
    e.preventDefault();
    // Calculator logic handled in render
  };

  return (
    <div className="wallet-calculator">
      {/* Header with Balance */}
      <div className="wallet-header" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '20px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FaWallet style={{ fontSize: '2rem', marginRight: '15px' }} />
            <div>
              <h2 style={{ margin: '0', fontSize: '1.5rem' }}>My Wallet</h2>
              <p style={{ margin: '5px 0 0 0', opacity: '0.9' }}>Total Balance</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '5px' }}>
              {realBalance.toLocaleString()} RWF
            </div>
            <button
              onClick={onRefresh}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="wallet-tabs" style={{
        display: 'flex',
        marginBottom: '20px',
        background: '#f8f9fa',
        borderRadius: '10px',
        padding: '5px',
        gap: '5px'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: FaWallet },
          { id: 'breakdown', label: 'Breakdown', icon: FaCoins },
          { id: 'analytics', label: 'Analytics', icon: FaChartLine },
          { id: 'calculator', label: 'Calculator', icon: FaCalculator }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === tab.id ? '#007bff' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="wallet-content">
        {activeTab === 'overview' && (
          <div className="overview-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Balance Cards */}
            {[
              { label: 'Available Balance', value: breakdown.netBalance, color: '#28a745', icon: FaMoneyBillWave },
              { label: 'Total Deposits', value: breakdown.deposits, color: '#007bff', icon: FaCoins },
              { label: 'Active Stakes', value: breakdown.stakePrincipals, color: '#6f42c1', icon: FaPiggyBank },
              { label: 'Referral Bonus', value: breakdown.bonus, color: '#fd7e14', icon: FaCoins }
            ].map((item, index) => (
              <div key={index} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                border: `2px solid ${item.color}20`,
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>{item.label}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: item.color }}>
                      {item.value.toLocaleString()} RWF
                    </p>
                  </div>
                  <item.icon style={{ fontSize: '2rem', color: item.color, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="breakdown-section">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Wallet Breakdown</h3>
            <div className="breakdown-items" style={{ display: 'grid', gap: '15px' }}>
              {[
                { label: 'Approved Deposits', value: breakdown.deposits, color: '#28a745', percentage: breakdown.netBalance > 0 ? (breakdown.deposits / breakdown.netBalance * 100).toFixed(1) : 0 },
                { label: 'Stake Principals', value: breakdown.stakePrincipals, color: '#007bff', percentage: breakdown.netBalance > 0 ? (breakdown.stakePrincipals / breakdown.netBalance * 100).toFixed(1) : 0 },
                { label: 'Matured Interest', value: breakdown.maturedInterest, color: '#6f42c1', percentage: breakdown.netBalance > 0 ? (breakdown.maturedInterest / breakdown.netBalance * 100).toFixed(1) : 0 },
                { label: 'Referral Bonuses', value: breakdown.bonus, color: '#fd7e14', percentage: breakdown.netBalance > 0 ? (breakdown.bonus / breakdown.netBalance * 100).toFixed(1) : 0 },
                { label: 'Total Withdrawals', value: -breakdown.withdrawals, color: '#dc3545', percentage: breakdown.netBalance > 0 ? (breakdown.withdrawals / breakdown.netBalance * 100).toFixed(1) : 0 }
              ].map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${item.color}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '600', color: '#333' }}>{item.label}</span>
                      <span style={{
                        background: item.color,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem'
                      }}>
                        {item.percentage}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e9ecef',
                      borderRadius: '4px',
                      marginTop: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.abs(item.percentage)}%`,
                        height: '100%',
                        background: item.color,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: item.value < 0 ? '#dc3545' : item.color,
                    marginLeft: '15px'
                  }}>
                    {item.value < 0 ? '-' : ''}{Math.abs(item.value).toLocaleString()} RWF
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Wallet Analytics</h3>
            <div className="analytics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {/* Performance Metrics */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Performance Metrics</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Transactions:</span>
                    <strong>{transactions.length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Approved Rate:</span>
                    <strong>{(Array.isArray(transactions) ? transactions : []).length > 0 ? (((Array.isArray(transactions) ? transactions : []).filter(t => t && t.status === 'approved').length / (Array.isArray(transactions) ? transactions : []).length) * 100).toFixed(1) : 0}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Stakes:</span>
                    <strong>{(Array.isArray(stakes) ? stakes : []).filter(s => s && s.status === 'active').length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Avg Transaction:</span>
                    <strong>{(Array.isArray(transactions) ? transactions : []).length > 0 ? (breakdown.deposits / (Array.isArray(transactions) ? transactions : []).filter(t => t && t.status === 'approved').length).toFixed(0) : 0} RWF</strong>
                  </div>
                </div>
              </div>

              {/* Growth Projection */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📈 Growth Projection</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Balance:</span>
                    <strong>{realBalance.toLocaleString()} RWF</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Potential Interest:</span>
                    <strong style={{ color: '#28a745' }}>
                      {(Array.isArray(stakes) ? stakes : []).filter(s => s && s.status === 'active').reduce((sum, s) => {
                        if (!s || !s.end_date || !s.amount || !s.interest_rate) return sum;
                        const currentDate = new Date();
                        const endDate = new Date(s.end_date);
                        if (currentDate < endDate) {
                          return sum + (s.amount * s.interest_rate);
                        }
                        return sum;
                      }, 0).toLocaleString()} RWF
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Monthly Growth:</span>
                    <strong style={{ color: '#007bff' }}>
                      {Math.round(breakdown.deposits * 0.05 / 12)} RWF
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="calculator-section">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Investment Calculator</h3>
            <div className="calculator-container" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {/* Calculator Form */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>💡 Calculate Returns</h4>
                <form onSubmit={handleCalculatorSubmit}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Investment Type
                    </label>
                    <select
                      value={calculatorInputs.type}
                      onChange={(e) => setCalculatorInputs({...calculatorInputs, type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="stake">Stake Investment</option>
                      <option value="savings">Regular Savings</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Amount (RWF)
                    </label>
                    <input
                      type="number"
                      value={calculatorInputs.amount}
                      onChange={(e) => setCalculatorInputs({...calculatorInputs, amount: e.target.value})}
                      placeholder="Enter amount"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {calculatorInputs.type === 'stake' && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Investment Period
                      </label>
                      <select
                        value={calculatorInputs.period}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, period: parseInt(e.target.value)})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '1rem'
                        }}
                      >
                        <option value={30}>30 Days (5% return)</option>
                        <option value={90}>90 Days (15% return)</option>
                        <option value={180}>180 Days (30% return)</option>
                      </select>
                    </div>
                  )}

                  {calculatorInputs.type === 'savings' && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                        Time Period (Months)
                      </label>
                      <input
                        type="number"
                        value={calculatorInputs.period}
                        onChange={(e) => setCalculatorInputs({...calculatorInputs, period: parseInt(e.target.value)})}
                        placeholder="Enter months"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  )}
                </form>
              </div>

              {/* Calculator Results */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Calculation Results</h4>
                {calculatorInputs.amount && (
                  <div>
                    {calculatorInputs.type === 'stake' ? (
                      (() => {
                        const result = calculateStakeReturn(parseFloat(calculatorInputs.amount), calculatorInputs.period);
                        return (
                          <div style={{ display: 'grid', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                              <span>Principal Amount:</span>
                              <strong>{result.principal.toLocaleString()} RWF</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#e8f5e8', borderRadius: '6px' }}>
                              <span>Interest Earned:</span>
                              <strong style={{ color: '#28a745' }}>+{result.interest.toLocaleString()} RWF</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#d1ecf1', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                              <span>Total Return:</span>
                              <strong style={{ color: '#007bff' }}>{result.total.toLocaleString()} RWF</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff3cd', borderRadius: '6px' }}>
                              <span>Monthly Equivalent:</span>
                              <strong style={{ color: '#856404' }}>{result.monthlyReturn.toFixed(0)} RWF/month</strong>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const result = calculateSavingsProjection(parseFloat(calculatorInputs.amount), calculatorInputs.period);
                        return (
                          <div style={{ display: 'grid', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                              <span>Total Investment:</span>
                              <strong>{result.principal.toLocaleString()} RWF</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#e8f5e8', borderRadius: '6px' }}>
                              <span>Interest Earned:</span>
                              <strong style={{ color: '#28a745' }}>+{result.interest.toFixed(0)} RWF</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#d1ecf1', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                              <span>Future Value:</span>
                              <strong style={{ color: '#007bff' }}>{result.total.toFixed(0)} RWF</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff3cd', borderRadius: '6px' }}>
                              <span>Monthly Deposit:</span>
                              <strong style={{ color: '#856404' }}>{result.monthlyContribution.toFixed(0)} RWF</strong>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
                {!calculatorInputs.amount && (
                  <div style={{
                    textAlign: 'center',
                    color: '#666',
                    padding: '40px',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <FaCalculator style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                    <p>Enter an amount to see calculation results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletCalculator;