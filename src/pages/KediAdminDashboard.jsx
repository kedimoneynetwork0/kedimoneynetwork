import React, { useState, useEffect } from 'react';
import {
  FaBars, FaTimes, FaTachometerAlt, FaUsers, FaClock, FaExchangeAlt,
  FaChartLine, FaBullhorn, FaCog, FaSignOutAlt, FaUser, FaCheck,
  FaTimes as FaReject, FaEye, FaPlus, FaLeaf, FaChevronDown,
  FaUserCheck, FaUserClock, FaMoneyBillWave, FaCoins, FaFilter
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
import {
  getPendingUsers,
  getPendingTransactions,
  getAllUsers,
  getAllTransactions,
  approveUser,
  approveTransaction,
  getCompanyAssets,
  getUserDetails,
  createNews,
  updateNews,
  deleteNews,
  getNews,
  getFullUrl,
  getPendingWithdrawals,
  approveWithdrawal,
  downloadUsersCSV,
  downloadTransactionsCSV,
  getAllMessagesAdmin,
  markMessageAsReadAdmin,
  sendMessageToUser
} from '../api';
import {
  calculateAdminMetrics,
  filterTransactions,
  getTransactionTypes,
  getTransactionStatuses,
  formatCurrency
} from '../utils/calculations';
import './admin-dashboard.css'; // Import original dashboard styles

const KediAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });

  const [pendingUsers, setPendingUsers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [companyAssets, setCompanyAssets] = useState(null);
  const [news, setNews] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHeader, setShowHeader] = useState(true);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    browserNotifications: Notification.permission === 'granted',
    soundEnabled: true,
    emailNotifications: true,
    userRegistrations: true,
    transactionApprovals: true,
    highValueTransactions: true,
    systemAlerts: false,
    autoRefresh: true,
    refreshInterval: 30 // seconds
  });

  // Filtering states
  const [transactionFilters, setTransactionFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    amountRange: 'all',
    user: ''
  });

  // Advanced search states
  const [advancedSearch, setAdvancedSearch] = useState({
    showAdvanced: false,
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    userEmail: '',
    transactionId: ''
  });

  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Bulk actions states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);

  // Enhanced pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [transactionPage, setTransactionPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);

  // Page size options
  const pageSizeOptions = [5, 10, 25, 50, 100];

  // Form states
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    media: null
  });

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: FaTachometerAlt },
    { id: 'users', label: 'User Management', icon: FaUsers },
    { id: 'pending', label: 'Pending Approvals', icon: FaClock },
    { id: 'transactions', label: 'Transactions', icon: FaExchangeAlt },
    { id: 'withdrawals', label: 'Withdrawal Management', icon: FaMoneyBillWave },
    { id: 'assets', label: 'Company Assets', icon: FaCoins },
    { id: 'messages', label: 'User Messages', icon: FaUser },
    { id: 'revenue', label: 'Revenue Report', icon: FaChartLine },
    { id: 'announcements', label: 'Announcements', icon: FaBullhorn },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    initializeNotifications();
    requestNotificationPermission();

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    // Set up real-time notification polling
    const notificationInterval = setInterval(() => {
      checkForNewNotifications();
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(notificationInterval);
    };
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 7000); // Auto-dismiss after 7 seconds for errors
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
          // Show a test notification
          showTestNotification();
        } else if (permission === 'denied') {
          console.log('Notification permission denied');
          setMessage('Browser notifications are disabled. You can enable them in your browser settings.');
        }
      } else if (Notification.permission === 'granted') {
        console.log('Notification permission already granted');
      }
    } else {
      console.log('This browser does not support notifications');
      setMessage('Your browser does not support desktop notifications.');
    }
  };

  // Show a test notification
  const showTestNotification = () => {
    if (Notification.permission === 'granted') {
      const notification = new Notification('KEDI Notifications Enabled', {
        body: 'You will now receive real-time notifications for important updates.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'kedi-notification-test',
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        notification.close();
      }, 3000);
    }
  };

  // Initialize notifications
  const initializeNotifications = () => {
    const sampleNotifications = [
      {
        id: 1,
        type: 'user_registration',
        title: 'New User Registration',
        message: 'John Doe has registered and is pending approval',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        priority: 'medium'
      },
      {
        id: 2,
        type: 'transaction_pending',
        title: 'Transaction Awaiting Approval',
        message: 'Tree planting transaction of 50,000 RWF needs approval',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        read: false,
        priority: 'high'
      },
      {
        id: 3,
        type: 'system_alert',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight at 2 AM',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true,
        priority: 'low'
      }
    ];

    setNotifications(sampleNotifications);
    setUnreadNotifications(sampleNotifications.filter(n => !n.read).length);
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3'); // You'll need to add this sound file
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      // Fallback: create a simple beep sound
      console.log('Notification sound played');
    }
  };

  // Enhanced real-time notification system
  const checkForNewNotifications = async () => {
    try {
      const newNotifications = [];
      const lastCheckTime = new Date(Date.now() - 1000 * 60 * 30); // Last 30 minutes

      // Check for new pending users
      const newPendingUsers = pendingUsers.filter(user =>
        new Date(user.created_at) > lastCheckTime
      );

      newPendingUsers.forEach(user => {
        const existingNotification = notifications.find(n =>
          n.type === 'user_registration' && n.message.includes(user.email)
        );

        if (!existingNotification) {
          newNotifications.push({
            id: Date.now() + Math.random(),
            type: 'user_registration',
            title: 'New User Registration',
            message: `${user.firstname} ${user.lastname} has registered and needs approval`,
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: '/admin-dashboard?section=pending',
            data: { userId: user.id, email: user.email }
          });
        }
      });

      // Check for new pending transactions
      const newPendingTransactions = allTransactions.filter(txn =>
        txn.status === 'pending' && new Date(txn.created_at) > lastCheckTime
      );

      newPendingTransactions.forEach(txn => {
        const existingNotification = notifications.find(n =>
          n.type === 'transaction_pending' && n.message.includes(txn.txn_id)
        );

        if (!existingNotification) {
          newNotifications.push({
            id: Date.now() + Math.random(),
            type: 'transaction_pending',
            title: 'Transaction Awaiting Approval',
            message: `${txn.type} transaction of ${formatCurrency(txn.amount)} RWF needs approval`,
            timestamp: new Date(),
            read: false,
            priority: 'high',
            actionUrl: '/admin-dashboard?section=transactions',
            data: { txnId: txn.id, amount: txn.amount }
          });
        }
      });

      // Check for high-value transactions
      const highValueTransactions = allTransactions.filter(txn =>
        txn.status === 'approved' &&
        txn.amount > 50000 && // Transactions over 50,000 RWF
        new Date(txn.created_at) > lastCheckTime
      );

      highValueTransactions.forEach(txn => {
        const existingNotification = notifications.find(n =>
          n.type === 'high_value_transaction' && n.data?.txnId === txn.id
        );

        if (!existingNotification) {
          newNotifications.push({
            id: Date.now() + Math.random(),
            type: 'high_value_transaction',
            title: 'High-Value Transaction Approved',
            message: `Large ${txn.type} transaction of ${formatCurrency(txn.amount)} RWF has been approved`,
            timestamp: new Date(),
            read: false,
            priority: 'medium',
            actionUrl: '/admin-dashboard?section=transactions',
            data: { txnId: txn.id, amount: txn.amount }
          });
        }
      });

      // Check for system alerts (simulated)
      const systemAlerts = Math.random() < 0.1 ? [{
        id: Date.now() + Math.random(),
        type: 'system_alert',
        title: 'System Health Check',
        message: 'All systems are running normally. Last check: ' + new Date().toLocaleTimeString(),
        timestamp: new Date(),
        read: false,
        priority: 'low',
        actionUrl: '/admin-dashboard?section=settings'
      }] : [];

      newNotifications.push(...systemAlerts);

      // Add new notifications if any
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
        setUnreadNotifications(prev => prev + newNotifications.length);

        // Play notification sound
        playNotificationSound();

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          newNotifications.forEach(notification => {
            const browserNotification = new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `${notification.type}-${notification.id}`,
              requireInteraction: notification.priority === 'high',
              silent: false,
              data: notification.data
            });

            // Add click handler for browser notifications
            browserNotification.onclick = () => {
              window.focus();
              if (notification.actionUrl) {
                // Navigate to the relevant section
                const url = new URL(window.location);
                url.searchParams.set('section', notification.actionUrl.split('=')[1]);
                window.history.pushState({}, '', url);
                // Trigger section change
                showSection(notification.actionUrl.split('=')[1]);
              }
              browserNotification.close();
            };

            // Auto-close non-high priority notifications
            if (notification.priority !== 'high') {
              setTimeout(() => {
                browserNotification.close();
              }, 5000);
            }
          });
        }

        // Show in-app notification toast
        newNotifications.forEach(notification => {
          showInAppNotification(notification);
        });
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  // Show in-app notification toast
  const showInAppNotification = (notification) => {
    // This would integrate with a toast notification system
    // For now, we'll use the existing message system
    if (notification.priority === 'high') {
      setMessage(`🚨 ${notification.title}: ${notification.message}`);
    }
  };

  // Load all dashboard data with enhanced error handling
  const loadDashboardData = async (retryCount = 0) => {
    const maxRetries = 3;
    setIsLoading(true);
    setError(null);

    try {
      setMessage('🔄 Loading dashboard data...');

      const [
        pendingUsersRes,
        allUsersRes,
        transactionsRes,
        assetsRes,
        newsRes,
        pendingWithdrawalsRes,
        messagesRes
      ] = await Promise.allSettled([
        getPendingUsers(),
        getAllUsers(),
        getAllTransactions(),
        getCompanyAssets(),
        getNews(),
        getPendingWithdrawals(),
        getAllMessagesAdmin()
      ]);

      // Check for partial failures
      const failures = [];
      const successes = [];

      // Process each API call result
      const processResult = (result, name) => {
        if (result.status === 'fulfilled') {
          successes.push(name);
          return result.value.data || [];
        } else {
          failures.push(`${name}: ${result.reason.message || 'Unknown error'}`);
          console.error(`${name} failed:`, result.reason);
          return [];
        }
      };

      const pendingUsersData = processResult(pendingUsersRes, 'Pending Users');
      const allUsersData = processResult(allUsersRes, 'All Users');
      const transactionsData = processResult(transactionsRes, 'Transactions');
      const assetsData = processResult(assetsRes, 'Company Assets')[0] || {};
      const newsData = processResult(newsRes, 'News');
      const pendingWithdrawalsData = processResult(pendingWithdrawalsRes, 'Pending Withdrawals');
      const messagesData = processResult(messagesRes, 'Messages');

      // Mock stakes data for calculations (in real app this would come from API)
      const stakesData = [];

      // Calculate admin metrics using the calculation functions
      const adminMetrics = calculateAdminMetrics(allUsersData, transactionsData, stakesData);

      setStats({
        totalUsers: adminMetrics.totalUsers,
        pendingUsers: adminMetrics.pendingUsers,
        totalTransactions: adminMetrics.totalTransactions,
        totalRevenue: adminMetrics.totalRevenue,
        totalDeposits: adminMetrics.totalDeposits,
        totalWithdrawals: adminMetrics.totalWithdrawals,
        approvedUsers: adminMetrics.approvedUsers,
        totalStakesAmount: adminMetrics.totalStakesAmount
      });

      // Update data states
      setPendingUsers(pendingUsersData);
      setAllUsers(allUsersData);
      setAllTransactions(transactionsData);
      setCompanyAssets(assetsData);
      setNews(newsData);
      setPendingWithdrawals(pendingWithdrawalsData);
      setMessages(messagesData);

      // Provide feedback based on results
      if (failures.length === 0) {
        setMessage('✅ Dashboard data loaded successfully!');
      } else if (successes.length > failures.length) {
        setMessage(`⚠️ Dashboard loaded with some issues. ${successes.length} successful, ${failures.length} failed.`);
        setError(`Some data failed to load: ${failures.join('; ')}`);
      } else {
        throw new Error(`Most API calls failed: ${failures.join('; ')}`);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);

      const errorMessage = err.message || 'Failed to load dashboard data';
      const isNetworkError = !err.response || err.code === 'NETWORK_ERROR';

      if (isNetworkError && retryCount < maxRetries) {
        setMessage(`🔄 Network error. Retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => loadDashboardData(retryCount + 1), 2000 * (retryCount + 1));
        return;
      }

      setError(`❌ ${errorMessage}. ${retryCount > 0 ? `Failed after ${retryCount} retries.` : ''} Please check your connection and try again.`);
      setMessage('');

      // Log detailed error information
      console.error('Dashboard data loading failed:', {
        error: errorMessage,
        retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/admin-login';
  };

  // Admin actions with enhanced error handling
  const handleApproveUser = async (userId, approve, retryCount = 0) => {
    const maxRetries = 2;
    const action = approve ? 'approve' : 'reject';

    // Enhanced confirmation dialog
    const userEmail = allUsers.find(u => u.id === userId)?.email || 'this user';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${userEmail}?\n\n` +
      `This action will ${approve ? 'grant access to' : 'deny access from'} the system.`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);

      // Show loading feedback
      setMessage(`Processing user ${action}...`);

      await approveUser(userId, approve);
      await loadDashboardData(); // Refresh data

      // Success feedback
      setMessage(`✅ User ${userEmail} ${action}d successfully!`);
      setError(null);

    } catch (err) {
      console.error('Error approving user:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      const isNetworkError = !err.response || err.code === 'NETWORK_ERROR';

      if (isNetworkError && retryCount < maxRetries) {
        // Retry for network errors
        const retry = window.confirm(
          `Network error occurred. Would you like to retry? (${retryCount + 1}/${maxRetries})`
        );
        if (retry) {
          setTimeout(() => handleApproveUser(userId, approve, retryCount + 1), 1000);
          return;
        }
      }

      // Enhanced error message
      setError(`❌ Failed to ${action} user: ${errorMessage}`);
      setMessage('');

      // Log for debugging
      console.error(`User ${action} failed:`, {
        userId,
        action,
        error: errorMessage,
        retryCount,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTransaction = async (txnId, approve, retryCount = 0) => {
    const maxRetries = 2;
    const action = approve ? 'approve' : 'reject';

    // Find transaction details for better feedback
    const transaction = allTransactions.find(t => t.id === txnId);
    const txnDetails = transaction ?
      `${transaction.type} - ${formatCurrency(transaction.amount)} RWF by ${transaction.email}` :
      'this transaction';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${txnDetails}?\n\n` +
      `This will ${approve ? 'process and complete' : 'cancel and refund'} the transaction.`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);

      // Show processing feedback
      setMessage(`🔄 Processing transaction ${action}...`);

      await approveTransaction(txnId, approve);
      await loadDashboardData(); // Refresh data

      // Success feedback with transaction details
      setMessage(`✅ Transaction ${action}d successfully!\n${txnDetails}`);
      setError(null);

    } catch (err) {
      console.error('Error approving transaction:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      const isNetworkError = !err.response || err.code === 'NETWORK_ERROR';
      const isServerError = err.response?.status >= 500;

      if ((isNetworkError || isServerError) && retryCount < maxRetries) {
        const retry = window.confirm(
          `${isNetworkError ? 'Network' : 'Server'} error occurred. Would you like to retry? (${retryCount + 1}/${maxRetries})`
        );
        if (retry) {
          setTimeout(() => handleApproveTransaction(txnId, approve, retryCount + 1), 1500);
          return;
        }
      }

      // Enhanced error message
      setError(`❌ Failed to ${action} transaction: ${errorMessage}`);
      setMessage('');

      // Log for debugging
      console.error(`Transaction ${action} failed:`, {
        txnId,
        transaction: txnDetails,
        action,
        error: errorMessage,
        retryCount,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWithdrawal = async (id, approve) => {
    try {
      await approveWithdrawal(id, approve);
      setMessage(`Withdrawal ${approve ? 'approved' : 'rejected'}`);
      await loadDashboardData(); // Refresh pending withdrawals list
    } catch (error) {
      setMessage('Error updating withdrawal status');
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', newsForm.title);
      formData.append('content', newsForm.content);
      if (newsForm.media) {
        formData.append('media', newsForm.media);
      }

      await createNews(formData);

      // Reset form and refresh data
      setNewsForm({ title: '', content: '', media: null });
      await loadDashboardData();
      alert('Announcement created successfully!');

    } catch (err) {
      console.error('Error creating news:', err);
      setError('Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNews = (newsItem) => {
    setNewsForm({
      title: newsItem.title,
      content: newsItem.content,
      media: null
    });
    setEditingNews(newsItem);
  };

  const handleDeleteNews = async (newsId) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await deleteNews(newsId);
        setMessage('News deleted successfully');
        await loadDashboardData();
      } catch (error) {
        setMessage('Error deleting news: ' + error.message);
      }
    }
  };

  const handleViewUserDetails = async (user) => {
    try {
      const response = await getUserDetails(user.id);
      setSelectedUser(user);
      setUserDetails(response.data);
      setActiveTab('user-details');
    } catch (error) {
      setMessage('Error loading user details: ' + error.message);
    }
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserDetails(null);
    setActiveTab('users');
  };

  const handleDownloadUsers = async () => {
    try {
      const response = await downloadUsersCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kedi_users_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Users list downloaded successfully');
    } catch (error) {
      setMessage('Error downloading users list');
      console.error('Download error:', error);
    }
  };

  const handleDownloadTransactions = async () => {
    try {
      const response = await downloadTransactionsCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kedi_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Transaction history downloaded successfully');
    } catch (error) {
      setMessage('Error downloading transaction history');
      console.error('Download error:', error);
    }
  };

  const handleMarkMessageAsRead = async (messageId) => {
    try {
      await markMessageAsReadAdmin(messageId);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
      setMessage('Message marked as read');
    } catch (error) {
      setMessage('Error marking message as read');
      console.error('Mark as read error:', error);
    }
  };

  const handleReplyToMessage = async (message) => {
    const replySubject = `Re: ${message.subject || 'Your Message'}`;
    const replyMessage = prompt('Enter your reply message:');

    if (!replyMessage || replyMessage.trim() === '') {
      return;
    }

    try {
      await sendMessageToUser({
        userId: message.user_id,
        subject: replySubject,
        message: replyMessage,
        type: 'reply',
        activityType: 'message_reply',
        activityId: message.id
      });

      setMessage('Reply sent successfully');
      // Refresh messages to show the new reply
      await loadDashboardData();
    } catch (error) {
      setMessage('Error sending reply');
      console.error('Reply error:', error);
    }
  };

  // Bulk action functions
  const handleSelectAllUsers = (checked) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkUserAction = async (action, retryCount = 0) => {
    const maxRetries = 1;
    const approve = action === 'approve';

    if (selectedUsers.length === 0) {
      setError('⚠️ Please select users to perform bulk action');
      return;
    }

    // Get user details for better feedback
    const selectedUserDetails = selectedUsers.map(userId => {
      const user = allUsers.find(u => u.id === userId);
      return user ? user.email : `User ${userId}`;
    });

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedUsers.length} user(s)?\n\n` +
      `Selected users:\n${selectedUserDetails.slice(0, 5).join('\n')}` +
      `${selectedUserDetails.length > 5 ? `\n...and ${selectedUserDetails.length - 5} more` : ''}\n\n` +
      `This action will ${approve ? 'grant access to' : 'deny access from'} the system for all selected users.`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);
      setMessage(`🔄 Processing bulk ${action} for ${selectedUsers.length} users...`);

      // Process bulk actions with individual error handling
      const results = await Promise.allSettled(
        selectedUsers.map(userId => approveUser(userId, approve))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      await loadDashboardData();

      if (failed === 0) {
        setMessage(`✅ Successfully ${action}d all ${successful} user(s)!`);
        setSelectedUsers([]);
      } else if (successful > 0) {
        setMessage(`⚠️ Partially successful: ${successful} user(s) ${action}d, ${failed} failed`);
        setError(`Some bulk actions failed. ${successful} succeeded, ${failed} failed.`);
      } else {
        throw new Error('All bulk actions failed');
      }

    } catch (error) {
      console.error('Bulk user action error:', error);

      const isNetworkError = !error.response || error.code === 'NETWORK_ERROR';

      if (isNetworkError && retryCount < maxRetries) {
        const retry = window.confirm(
          `Network error during bulk operation. Would you like to retry? (${retryCount + 1}/${maxRetries})`
        );
        if (retry) {
          setTimeout(() => handleBulkUserAction(action, retryCount + 1), 2000);
          return;
        }
      }

      setError(`❌ Bulk ${action} failed: ${error.message || 'Unknown error'}`);
      setMessage('');

      // Log detailed error information
      console.error('Bulk user action failed:', {
        action,
        selectedUsers,
        error: error.message,
        retryCount,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAllTransactions = (checked) => {
    if (checked) {
      const filteredTxns = applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status));
      setSelectedTransactions(filteredTxns.map(txn => txn.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (txnId, checked) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, txnId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== txnId));
    }
  };

  const handleBulkTransactionAction = async (action) => {
    if (selectedTransactions.length === 0) {
      alert('Please select transactions to perform bulk action');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedTransactions.length} transaction(s)?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const approve = action === 'approve';

      // Process bulk actions
      const promises = selectedTransactions.map(txnId => approveTransaction(txnId, approve));
      await Promise.all(promises);

      await loadDashboardData();
      setSelectedTransactions([]);
      alert(`Successfully ${action}d ${selectedTransactions.length} transaction(s)`);
    } catch (error) {
      console.error('Bulk transaction action error:', error);
      setError('Failed to perform bulk transaction action');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW').format(amount);
  };

  // Notification functions
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadNotifications(0);
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadNotifications(prev => prev + 1);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'user_registration': return '👤';
      case 'transaction_pending': return '💳';
      case 'system_alert': return '⚠️';
      case 'withdrawal_request': return '💰';
      default: return '📢';
    }
  };

  const getNotificationPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Advanced filtering functions
  const applyAdvancedFilters = (transactions) => {
    return transactions.filter(txn => {
      // Date range filter
      if (advancedSearch.dateFrom || advancedSearch.dateTo) {
        const txnDate = new Date(txn.created_at);
        const fromDate = advancedSearch.dateFrom ? new Date(advancedSearch.dateFrom) : null;
        const toDate = advancedSearch.dateTo ? new Date(advancedSearch.dateTo) : null;

        if (fromDate && txnDate < fromDate) return false;
        if (toDate && txnDate > toDate) return false;
      }

      // Amount range filter
      if (advancedSearch.minAmount || advancedSearch.maxAmount) {
        const minAmount = parseFloat(advancedSearch.minAmount) || 0;
        const maxAmount = parseFloat(advancedSearch.maxAmount) || Infinity;

        if (txn.amount < minAmount || txn.amount > maxAmount) return false;
      }

      // User email filter
      if (advancedSearch.userEmail && !txn.email.toLowerCase().includes(advancedSearch.userEmail.toLowerCase())) {
        return false;
      }

      // Transaction ID filter
      if (advancedSearch.transactionId && !txn.txn_id.toLowerCase().includes(advancedSearch.transactionId.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  // Filtered data based on search term
  const filteredPendingUsers = pendingUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(user =>
    (user.firstname + ' ' + user.lastname).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingTxns = pendingUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllTransactions = allTransactions.filter(txn =>
    txn.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.txn_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingWithdrawals = pendingWithdrawals.filter(withdrawal =>
    withdrawal.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Chart data generation functions
  const generateUserRegistrationData = () => {
    // Get last 12 months of user registration data
    const last12Months = [];
    const registrationCounts = [];
    const approvedCounts = [];
    const pendingCounts = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last12Months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));

      // Count users registered in this month
      const monthUsers = allUsers.filter(user => {
        const userDate = new Date(user.created_at);
        return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear();
      });

      const approvedUsers = monthUsers.filter(user => user.status === 'approved');
      const pendingUsers = monthUsers.filter(user => user.status === 'pending');

      registrationCounts.push(monthUsers.length);
      approvedCounts.push(approvedUsers.length);
      pendingCounts.push(pendingUsers.length);
    }

    return {
      labels: last12Months,
      datasets: [
        {
          label: 'Total Registrations',
          data: registrationCounts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Approved Users',
          data: approvedCounts,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Pending Users',
          data: pendingCounts,
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        }
      ]
    };
  };

  const generateTransactionVolumeData = () => {
    // Get last 12 months of transaction data
    const last12Months = [];
    const totalTransactions = [];
    const approvedTransactions = [];
    const pendingTransactions = [];
    const rejectedTransactions = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last12Months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));

      // Count transactions in this month by status
      const monthTransactions = allTransactions.filter(txn => {
        const txnDate = new Date(txn.created_at);
        return txnDate.getMonth() === date.getMonth() && txnDate.getFullYear() === date.getFullYear();
      });

      const approved = monthTransactions.filter(txn => txn.status === 'approved');
      const pending = monthTransactions.filter(txn => txn.status === 'pending');
      const rejected = monthTransactions.filter(txn => txn.status === 'rejected');

      totalTransactions.push(monthTransactions.length);
      approvedTransactions.push(approved.length);
      pendingTransactions.push(pending.length);
      rejectedTransactions.push(rejected.length);
    }

    return {
      labels: last12Months,
      datasets: [
        {
          label: 'Total Transactions',
          data: totalTransactions,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Approved',
          data: approvedTransactions,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Pending',
          data: pendingTransactions,
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Rejected',
          data: rejectedTransactions,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        }
      ]
    };
  };

  const generateRevenueData = () => {
    // Get last 6 months of revenue data
    const last6Months = [];
    const revenueAmounts = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last6Months.push(date.toLocaleDateString('en-US', { month: 'short' }));

      // Calculate revenue for this month
      const monthRevenue = allTransactions
        .filter(txn => {
          const txnDate = new Date(txn.created_at);
          return txnDate.getMonth() === date.getMonth() &&
                 txnDate.getFullYear() === date.getFullYear() &&
                 txn.status === 'approved';
        })
        .reduce((sum, txn) => sum + txn.amount, 0);

      revenueAmounts.push(monthRevenue);
    }

    return {
      labels: last6Months,
      datasets: [{
        label: 'Revenue (RWF)',
        data: revenueAmounts,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  };

  const generateUserStatusData = () => {
    const statusCounts = {
      approved: allUsers.filter(user => user.status === 'approved').length,
      pending: allUsers.filter(user => user.status === 'pending').length,
      rejected: allUsers.filter(user => user.status === 'rejected').length,
    };

    return {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [{
        data: [statusCounts.approved, statusCounts.pending, statusCounts.rejected],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      }]
    };
  };

  const generateTransactionTypeData = () => {
    const typeCounts = {
      tree_plan: allTransactions.filter(txn => txn.type === 'tree_plan').length,
      loan: allTransactions.filter(txn => txn.type === 'loan').length,
      savings: allTransactions.filter(txn => txn.type === 'savings').length,
    };

    return {
      labels: ['Tree Plan', 'Loan', 'Savings'],
      datasets: [{
        data: [typeCounts.tree_plan, typeCounts.loan, typeCounts.savings],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 2,
      }]
    };
  };

  const generateTransactionAmountData = () => {
    // Get last 12 months of transaction amount data
    const last12Months = [];
    const totalAmounts = [];
    const approvedAmounts = [];
    const pendingAmounts = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last12Months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));

      // Calculate transaction amounts in this month by status
      const monthTransactions = allTransactions.filter(txn => {
        const txnDate = new Date(txn.created_at);
        return txnDate.getMonth() === date.getMonth() && txnDate.getFullYear() === date.getFullYear();
      });

      const totalAmount = monthTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      const approvedAmount = monthTransactions
        .filter(txn => txn.status === 'approved')
        .reduce((sum, txn) => sum + txn.amount, 0);
      const pendingAmount = monthTransactions
        .filter(txn => txn.status === 'pending')
        .reduce((sum, txn) => sum + txn.amount, 0);

      totalAmounts.push(totalAmount);
      approvedAmounts.push(approvedAmount);
      pendingAmounts.push(pendingAmount);
    }

    return {
      labels: last12Months,
      datasets: [
        {
          label: 'Total Amount',
          data: totalAmounts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Approved Amount',
          data: approvedAmounts,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Pending Amount',
          data: pendingAmounts,
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        }
      ]
    };
  };

  const generateTopUsersData = () => {
    // Get top 10 users by transaction volume
    const userTransactionTotals = {};

    allTransactions.forEach(txn => {
      if (txn.status === 'approved') {
        if (!userTransactionTotals[txn.email]) {
          userTransactionTotals[txn.email] = 0;
        }
        userTransactionTotals[txn.email] += txn.amount;
      }
    });

    const sortedUsers = Object.entries(userTransactionTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      labels: sortedUsers.map(([email]) => email.split('@')[0] + '...'),
      datasets: [{
        label: 'Transaction Volume (RWF)',
        data: sortedUsers.map(([, amount]) => amount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          label: function(context) {
            if (context.dataset.label.includes('Revenue') || context.dataset.label.includes('Balance')) {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            if (this.chart.data.datasets.some(ds => ds.label.includes('Revenue'))) {
              return formatCurrency(value);
            }
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      line: {
        tension: 0.4,
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };


  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => {
    if (!userSearchTerm) return true;

    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.firstname?.toLowerCase().includes(searchLower) ||
      user.lastname?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower) ||
      user.idNumber?.toLowerCase().includes(searchLower) ||
      user.id?.toString().includes(searchLower)
    );
  });

  // Enhanced pagination functions
  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const getPaginatedTransactions = () => {
    const filteredTxns = applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status));
    const startIndex = (transactionPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTxns.slice(startIndex, endIndex);
  };

  const getPaginatedPendingUsers = () => {
    const startIndex = (pendingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPendingUsers.slice(startIndex, endIndex);
  };

  const getPaginatedNews = () => {
    const startIndex = (newsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredNews.slice(startIndex, endIndex);
  };

  const getPaginatedWithdrawals = () => {
    const startIndex = (withdrawalsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPendingWithdrawals.slice(startIndex, endIndex);
  };

  // Calculate total pages for each section
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalTransactionPages = Math.ceil(
    applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status)).length / itemsPerPage
  );
  const totalPendingPages = Math.ceil(filteredPendingUsers.length / itemsPerPage);
  const totalNewsPages = Math.ceil(filteredNews.length / itemsPerPage);
  const totalWithdrawalsPages = Math.ceil(filteredPendingWithdrawals.length / itemsPerPage);

  // Enhanced pagination component
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems,
    showPageSizeSelector = true
  }) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
        {/* Page size selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                onPageChange(1); // Reset to first page
              }}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        )}

        {/* Pagination info */}
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-2 text-sm font-medium border ${
                page === currentPage
                  ? 'text-white bg-green-600 border-green-600'
                  : page === '...'
                  ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-default'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        {/* Jump to page */}
        {totalPages > 5 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              placeholder={currentPage}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page);
                    e.target.value = '';
                  }
                }
              }}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
    );
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [userSearchTerm]);

  useEffect(() => {
    setTransactionPage(1);
  }, [transactionFilters, advancedSearch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        aria-expanded={sidebarOpen}
      >
        <FaBars size={20} aria-hidden="true" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-green-800 to-green-900 text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-green-700">
            <h1 className="text-lg font-bold text-white">KEDI BUSINESS & AGRI FUNDS</h1>
            <button
              className="lg:hidden text-white hover:text-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-800"
              onClick={toggleSidebar}
              aria-label="Close navigation menu"
            >
              <FaTimes size={24} aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2" role="navigation" aria-label="Dashboard sections">
            <h2 className="sr-only">Dashboard Navigation</h2>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-800 ${
                  currentSection === item.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                }`}
                onClick={() => showSection(item.id)}
                aria-current={currentSection === item.id ? 'page' : undefined}
                aria-label={`Navigate to ${item.label}`}
              >
                <item.icon className="mr-3 text-lg" aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-green-700">
            <button
              className="w-full flex items-center px-4 py-3 text-left text-red-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 focus:ring-offset-green-800"
              onClick={logout}
              aria-label="Logout from admin dashboard"
            >
              <FaSignOutAlt className="mr-3" aria-hidden="true" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <main id="main-content" className="lg:ml-64 min-h-screen" role="main">
        <div className="p-4 lg:p-8">
          {/* Initial Loading Skeleton */}
          {isLoading && allUsers.length === 0 && (
            <div className="space-y-6">
              {/* Welcome Section Skeleton */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="animate-pulse bg-gray-200 h-8 w-80 rounded mb-2"></div>
                    <div className="animate-pulse bg-gray-200 h-4 w-96 rounded"></div>
                  </div>
                  <div className="animate-pulse bg-gray-200 h-12 w-32 rounded-lg"></div>
                </div>
              </div>

              {/* Overview Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="animate-pulse bg-gray-200 p-3 rounded-lg w-12 h-12"></div>
                          <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                        </div>
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mb-1"></div>
                        <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse bg-gray-200 h-6 w-48 rounded mb-6"></div>
                    <div className="space-y-4">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="animate-pulse bg-gray-200 w-12 h-12 rounded-full"></div>
                            <div>
                              <div className="animate-pulse bg-gray-200 h-4 w-32 rounded mb-1"></div>
                              <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                            </div>
                          </div>
                          <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') || message.includes('error')
                ? 'bg-red-100 border border-red-400 text-red-700'
                : 'bg-green-100 border border-green-400 text-green-700'
            }`}>
              <div className="flex items-center">
                {message.includes('Error') || message.includes('error') ? (
                  <FaTimes className="mr-2 text-red-500" />
                ) : (
                  <FaCheck className="mr-2 text-green-500" />
                )}
                {message}
              </div>
            </div>
          )}

        {/* Overview Section */}
        {currentSection === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Admin Dashboard - Manage KEDI Funds
                </h1>
                <p className="text-gray-600 text-lg">
                  Monitor users, transactions, and system performance in real-time
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors relative"
                    title="Notifications"
                  >
                    <FaUser size={20} />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96">
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FaUser className="mr-2 text-blue-600" />
                            Notifications
                            {unreadNotifications > 0 && (
                              <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                                {unreadNotifications}
                              </span>
                            )}
                          </h3>
                          {unreadNotifications > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                                !notification.read ? getNotificationPriorityColor(notification.priority) : ''
                              } ${!notification.read ? 'border-l-4' : ''} ${
                                notification.priority === 'high' ? 'border-l-red-500' :
                                notification.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                              }`}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`text-2xl p-2 rounded-lg ${
                                  notification.priority === 'high' ? 'bg-red-100 text-red-600' :
                                  notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`text-sm font-semibold truncate ${
                                      !notification.read ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {notification.title}
                                      {notification.priority === 'high' && (
                                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                                          HIGH
                                        </span>
                                      )}
                                    </h4>
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                      {getTimeAgo(notification.timestamp)}
                                    </span>
                                  </div>
                                  <p className={`text-sm mt-1 ${
                                    !notification.read ? 'text-gray-700' : 'text-gray-600'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  {!notification.read && (
                                    <div className="mt-2 flex items-center">
                                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                      <span className="text-xs text-blue-600 font-medium">New</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-200">
                        <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm">
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={loadDashboardData}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FaExchangeAlt className="mr-2" />
                  )}
                  Refresh Data
                </button>
              </div>
            </div>
            </div>

            {/* Enhanced Search and Filter Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {/* Main Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users, transactions, or announcements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAdvancedSearch({...advancedSearch, showAdvanced: !advancedSearch.showAdvanced})}
                      className={`px-4 py-3 font-medium rounded-lg transition-colors ${
                        advancedSearch.showAdvanced
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <FaFilter className="inline mr-2" />
                      {advancedSearch.showAdvanced ? 'Hide Filters' : 'Advanced'}
                    </button>
                    <button
                      onClick={() => setShowHeader(!showHeader)}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                    >
                      {showHeader ? 'Hide Header' : 'Show Header'}
                    </button>
                  </div>
                </div>

                {/* Quick Filter Tags */}
                {searchTerm && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">Searching for:</span>
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Search Panel */}
            {advancedSearch.showAdvanced && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaFilter className="mr-2 text-blue-600" />
                  Advanced Search & Filters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Date From</label>
                    <input
                      type="date"
                      value={advancedSearch.dateFrom}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, dateFrom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Date To</label>
                    <input
                      type="date"
                      value={advancedSearch.dateTo}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, dateTo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Min Amount (RWF)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={advancedSearch.minAmount}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, minAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Max Amount (RWF)</label>
                    <input
                      type="number"
                      placeholder="No limit"
                      value={advancedSearch.maxAmount}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, maxAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* User Email */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">User Email</label>
                    <input
                      type="email"
                      placeholder="Search by user email"
                      value={advancedSearch.userEmail}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, userEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                    <input
                      type="text"
                      placeholder="Search by transaction ID"
                      value={advancedSearch.transactionId}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, transactionId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {applyAdvancedFilters(allTransactions).length} of {allTransactions.length} transactions match filters
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setAdvancedSearch({
                          showAdvanced: true,
                          dateFrom: '',
                          dateTo: '',
                          minAmount: '',
                          maxAmount: '',
                          userEmail: '',
                          transactionId: ''
                        });
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => setAdvancedSearch({...advancedSearch, showAdvanced: false})}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FaUsers className="text-xl text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Total Users</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                      ) : (
                        stats.totalUsers
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      Registered users
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <FaUserClock className="text-xl text-yellow-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Pending Approvals</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                      ) : (
                        stats.pendingUsers
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      Awaiting approval
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FaExchangeAlt className="text-xl text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Total Transactions</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                      ) : (
                        stats.totalTransactions
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      All transactions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <FaCoins className="text-xl text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {isLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                      ) : (
                        formatCurrency(stats.totalRevenue) + ' RWF'
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">
                      System assets
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Analytics Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Advanced Analytics Dashboard</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Last 12 months</span>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* User Registration Trend */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">User Growth Trend</h4>
                    <div className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      +{allUsers.length} total users
                    </div>
                  </div>
                  <div className="h-64">
                    <Line data={generateUserRegistrationData()} options={chartOptions} />
                  </div>
                </div>

                {/* Transaction Volume Trend */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Transaction Activity</h4>
                    <div className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {allTransactions.length} transactions
                    </div>
                  </div>
                  <div className="h-64">
                    <Line data={generateTransactionVolumeData()} options={chartOptions} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Transaction Amount Trend */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Revenue Trend</h4>
                    <div className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {formatCurrency(allTransactions.reduce((sum, txn) => sum + txn.amount, 0))} total
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar data={generateTransactionAmountData()} options={chartOptions} />
                  </div>
                </div>

                {/* Top Users by Transaction Volume */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Top Performing Users</h4>
                    <div className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      By transaction volume
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={generateTopUsersData()}
                      options={{
                        ...chartOptions,
                        indexAxis: 'y',
                        plugins: {
                          ...chartOptions.plugins,
                          legend: { display: false }
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatCurrency(value);
                              }
                            }
                          },
                          y: {
                            grid: { display: false }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Users Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Pending Users</h3>
                  <button
                    onClick={() => showSection('pending')}
                    className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-4">
                  {pendingUsers.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-green-600 text-lg" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-600">Pending approval</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveUser(user.id, true)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Approve"
                        >
                          <FaCheck className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleApproveUser(user.id, false)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          title="Reject"
                        >
                          <FaReject className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingUsers.length === 0 && (
                    <div className="text-center py-8">
                      <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No pending users</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
                  <button
                    onClick={() => showSection('transactions')}
                    className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-4">
                  {allTransactions.slice(0, 3).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaExchangeAlt className="text-blue-600 text-lg" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{txn.email}</p>
                          <p className="text-sm text-gray-600">{txn.type} - {formatCurrency(txn.amount)} RWF</p>
                        </div>
                      </div>
                      {getStatusBadge(txn.status)}
                    </div>
                  ))}
                  {allTransactions.length === 0 && (
                    <div className="text-center py-8">
                      <FaExchangeAlt className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No transactions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        {currentSection === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">All Users Management</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleDownloadUsers}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <FaEye className="mr-2" />
                    Download CSV
                  </button>
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    Total: {allUsers.length} | Approved: {allUsers.filter(u => u.status === 'approved').length}
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="relative">
                      <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, phone, or ID number..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        {filteredUsers.length} of {allUsers.length} users
                      </span>
                    </div>
                    <button
                      onClick={() => setBulkActionMode(!bulkActionMode)}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                        bulkActionMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {bulkActionMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
                    </button>
                  </div>
                </div>

                {/* Bulk Actions Bar */}
                {bulkActionMode && selectedUsers.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-blue-800">
                          {selectedUsers.length} user(s) selected
                        </span>
                        <button
                          onClick={() => setSelectedUsers([])}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Clear selection
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBulkUserAction('approve')}
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Processing...' : 'Approve Selected'}
                        </button>
                        <button
                          onClick={() => handleBulkUserAction('reject')}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Processing...' : 'Reject Selected'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {bulkActionMode && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                              onChange={(e) => handleSelectAllUsers(e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Number</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getPaginatedUsers().map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          {bulkActionMode && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.firstname} {user.lastname}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                            {user.idNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role || 'user'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatCurrency(user.estimated_balance || 0)} RWF
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {user.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveUser(user.id, true)}
                                    className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                                  >
                                    <FaCheck className="mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproveUser(user.id, false)}
                                    className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                                  >
                                    <FaReject className="mr-1" />
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => showSection('user-details')}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                              >
                                <FaEye className="mr-1" />
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {allUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <FaFilter className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users match your search criteria</p>
                    <p className="text-sm text-gray-400 mt-1">"{userSearchTerm}"</p>
                  </div>
                ) : null}
              </div>

              {/* Pagination Controls */}
              {filteredUsers.length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalUserPages - 4, currentPage - 2)) + i;
                      if (pageNum > totalUserPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'text-white bg-green-600 border border-green-600'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalUserPages))}
                      disabled={currentPage === totalUserPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Approvals Section */}
        {currentSection === 'pending' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Pending User Approvals</h3>
                <div className="text-sm text-gray-600 bg-yellow-100 px-3 py-2 rounded-lg">
                  {filteredPendingUsers.length} pending approval{filteredPendingUsers.length !== 1 ? 's' : ''}
                </div>
              </div>

              {filteredPendingUsers.length === 0 ? (
                <div className="text-center py-12">
                  <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending users to approve</p>
                  <p className="text-sm text-gray-400 mt-1">All users have been processed</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registration Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getPaginatedPendingUsers().map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge('pending')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveUser(user.id, true)}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                                  >
                                    <FaCheck className="mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproveUser(user.id, false)}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                                  >
                                    <FaReject className="mr-1" />
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <PaginationControls
                    currentPage={pendingPage}
                    totalPages={totalPendingPages}
                    onPageChange={setPendingPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredPendingUsers.length}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* User Messages Section */}
        {currentSection === 'messages' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">User Messages & Support Requests</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 bg-blue-100 px-3 py-2 rounded-lg">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-gray-600">
                    {messages.filter(m => !m.is_read).length} unread
                  </div>
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Messages from users will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`p-4 rounded-lg border transition-all duration-200 ${
                      !msg.is_read
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {msg.subject || 'Message from User'}
                            </h4>
                            {!msg.is_read && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">
                            From: {msg.user_firstname} {msg.user_lastname} ({msg.user_email})
                          </p>
                          {msg.admin_firstname && (
                            <p className="text-gray-600 text-sm">
                              Admin: {msg.admin_firstname} {msg.admin_lastname}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            msg.type === 'notification'
                              ? 'bg-blue-100 text-blue-800'
                              : msg.type === 'support'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {msg.type || 'message'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {getTimeAgo(msg.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border mb-3">
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {!msg.is_read && (
                            <button
                              onClick={() => handleMarkMessageAsRead(msg.id)}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                            >
                              <FaCheck className="mr-1" />
                              Mark as Read
                            </button>
                          )}
                          <button
                            onClick={() => handleReplyToMessage(msg)}
                            className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {msg.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Section */}
        {currentSection === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">All Transactions</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={() => setAdvancedSearch({...advancedSearch, showAdvanced: !advancedSearch.showAdvanced})}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <FaFilter className="mr-2" />
                    {advancedSearch.showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
                  </button>
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                    {applyAdvancedFilters(allTransactions).length} of {allTransactions.length} transactions
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {advancedSearch.showAdvanced && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Advanced Filters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                      <input
                        type="date"
                        value={advancedSearch.dateFrom}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, dateFrom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                      <input
                        type="date"
                        value={advancedSearch.dateTo}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, dateTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Amount Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount (RWF)</label>
                      <input
                        type="number"
                        value={advancedSearch.minAmount}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, minAmount: e.target.value})}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount (RWF)</label>
                      <input
                        type="number"
                        value={advancedSearch.maxAmount}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, maxAmount: e.target.value})}
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* User Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User Email</label>
                      <input
                        type="email"
                        value={advancedSearch.userEmail}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, userEmail: e.target.value})}
                        placeholder="Search by email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Transaction ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                      <input
                        type="text"
                        value={advancedSearch.transactionId}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, transactionId: e.target.value})}
                        placeholder="Search by TXN ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      onClick={() => setAdvancedSearch({
                        showAdvanced: true,
                        dateFrom: '',
                        dateTo: '',
                        minAmount: '',
                        maxAmount: '',
                        userEmail: '',
                        transactionId: ''
                      })}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Actions for Transactions */}
              {selectedTransactions.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedTransactions.length} transaction(s) selected
                      </span>
                      <button
                        onClick={() => setSelectedTransactions([])}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Clear selection
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkTransactionAction('approve')}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Approve Selected'}
                      </button>
                      <button
                        onClick={() => handleBulkTransactionAction('reject')}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Reject Selected'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
                </div>
                <select
                  value={transactionFilters.type}
                  onChange={(e) => setTransactionFilters({...transactionFilters, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {getTransactionTypes().map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <select
                  value={transactionFilters.status}
                  onChange={(e) => setTransactionFilters({...transactionFilters, status: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {getTransactionStatuses().map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.length === applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status)).length && applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status)).length > 0}
                            onChange={(e) => handleSelectAllTransactions(e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getPaginatedTransactions().map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.includes(txn.id)}
                              onChange={(e) => handleSelectTransaction(txn.id, e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {txn.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {txn.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatCurrency(txn.amount)} RWF
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(txn.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {txn.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApproveTransaction(txn.id, true)}
                                  className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                                >
                                  <FaCheck className="mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApproveTransaction(txn.id, false)}
                                  className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                                >
                                  <FaTimes className="mr-1" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status)).length === 0 && (
                  <div className="text-center py-12">
                    <FaFilter className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No transactions found matching the filters</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls for Transactions */}
              {applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status)).length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((transactionPage - 1) * itemsPerPage) + 1} to {Math.min(transactionPage * itemsPerPage, applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status)).length)} of {applyAdvancedFilters(filterTransactions(allTransactions, transactionFilters.type, transactionFilters.status)).length} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setTransactionPage(prev => Math.max(prev - 1, 1))}
                      disabled={transactionPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalTransactionPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalTransactionPages - 4, transactionPage - 2)) + i;
                      if (pageNum > totalTransactionPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setTransactionPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            transactionPage === pageNum
                              ? 'text-white bg-green-600 border border-green-600'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setTransactionPage(prev => Math.min(prev + 1, totalTransactionPages))}
                      disabled={transactionPage === totalTransactionPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Revenue Report Section */}
        {currentSection === 'revenue' && (
          <div>
            <div className="dashboard-grid">
              {/* Revenue Summary Cards */}
              <div className="dashboard-card">
                <h3>Revenue Summary</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Deposits</p>
                      <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.totalDeposits || 0)} RWF</p>
                    </div>
                    <FaMoneyBillWave className="text-3xl text-green-500" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Total Withdrawals</p>
                      <p className="text-2xl font-bold text-red-800">{formatCurrency(stats.totalWithdrawals || 0)} RWF</p>
                    </div>
                    <FaMoneyBillWave className="text-3xl text-red-500" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Net Revenue</p>
                      <p className={`text-2xl font-bold ${stats.totalRevenue >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                        {formatCurrency(stats.totalRevenue || 0)} RWF
                      </p>
                    </div>
                    <FaChartLine className={`text-3xl ${stats.totalRevenue >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Active Stakes Value</p>
                      <p className="text-2xl font-bold text-purple-800">{formatCurrency(stats.totalStakesAmount || 0)} RWF</p>
                    </div>
                    <FaCoins className="text-3xl text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Revenue Analytics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Revenue Analytics</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Trend Chart */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend (6 Months)</h4>
                    <div className="h-64">
                      <Bar data={generateRevenueData()} options={chartOptions} />
                    </div>
                  </div>

                  {/* Transaction Types Distribution */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Transaction Types</h4>
                    <div className="h-64">
                      <Doughnut data={generateTransactionTypeData()} options={pieChartOptions} />
                    </div>
                  </div>
                </div>

                {/* User Growth Chart */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">User Growth Trend</h4>
                  <div className="h-64">
                    <Line data={generateUserRegistrationData()} options={chartOptions} />
                  </div>
                </div>

                {/* User Status Distribution */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">User Status Distribution</h4>
                  <div className="h-64">
                    <Pie data={generateUserStatusData()} options={pieChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Announcements Section */}
        {currentSection === 'announcements' && (
          <div>
            <div className="dashboard-grid">
              {/* Create Announcement */}
              <div className="dashboard-card">
                <h3>Create Announcement</h3>

                <form onSubmit={handleCreateNews}>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                      placeholder="Announcement title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Content *</label>
                    <textarea
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                      placeholder="Announcement content"
                      rows="6"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Media (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => setNewsForm({...newsForm, media: e.target.files[0]})}
                      accept="image/*,video/*"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="action-button"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaPlus className="mr-2" />
                    )}
                    Post Announcement
                  </button>
                </form>
              </div>

              {/* Existing Announcements */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Announcements</h3>
                  <div className="text-sm text-gray-600 bg-blue-100 px-3 py-2 rounded-lg">
                    {filteredNews.length} announcement{filteredNews.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {filteredNews.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBullhorn className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No announcements yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first announcement above</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {getPaginatedNews().map((item) => (
                        <div key={item.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900 text-lg">{item.title}</h4>
                            <div className="flex items-center space-x-2">
                              {item.media_url && (
                                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  📎 Media attached
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{item.content}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              ID: {item.id}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditNews(item)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNews(item.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={newsPage}
                      totalPages={totalNewsPages}
                      onPageChange={setNewsPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={filteredNews.length}
                      showPageSizeSelector={false}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Details Section */}
        {currentSection === 'user-details' && (
          <div>
            <div className="dashboard-card">
              <div className="flex justify-between items-center mb-6">
                <h3>User Details</h3>
                <button
                  onClick={() => showSection('users')}
                  className="action-button secondary"
                >
                  <FaArrowLeft className="mr-2" />
                  Back to Users
                </button>
              </div>

              {userDetails ? (
                <div className="space-y-6">
                  {/* User Profile Summary */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-600">
                          {userDetails.user?.firstname?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">
                          {userDetails.user?.firstname} {userDetails.user?.lastname}
                        </h4>
                        <p className="text-gray-600">{userDetails.user?.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          {getStatusBadge(userDetails.user?.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userDetails.user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userDetails.user?.role || 'user'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(userDetails.user?.estimated_balance || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Balance (RWF)</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {userDetails.transactions?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Transactions</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {userDetails.stakes?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Active Stakes</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {userDetails.withdrawals?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Withdrawals</div>
                      </div>
                    </div>
                  </div>

                  {/* Balance Breakdown */}
                  {userDetails.balanceCalculation?.breakdown && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-800 mb-4">Balance Breakdown</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(userDetails.balanceCalculation.breakdown.totalCredits || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Total Credits</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-xl font-bold text-red-600">
                            {formatCurrency(userDetails.balanceCalculation.breakdown.totalDebits || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Total Debits</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(userDetails.balanceCalculation.estimatedBalance || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Net Balance</div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>Tree Plans: {formatCurrency(userDetails.balanceCalculation.breakdown.treePlan || 0)}</div>
                        <div>Stake Revenue: {formatCurrency(userDetails.balanceCalculation.breakdown.stakeRevenue || 0)}</div>
                        <div>Savings: {formatCurrency(userDetails.balanceCalculation.breakdown.savings || 0)}</div>
                        <div>Bonuses: {formatCurrency(userDetails.balanceCalculation.breakdown.bonuses || 0)}</div>
                        <div className="text-red-600">Loan Repayments: -{formatCurrency(userDetails.balanceCalculation.breakdown.loanRepayments || 0)}</div>
                      </div>
                    </div>
                  )}

                  {/* User Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Full Name:</span>
                          <span>{userDetails.user?.firstname} {userDetails.user?.lastname}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Email:</span>
                          <span>{userDetails.user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Phone:</span>
                          <span>{userDetails.user?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">ID Number:</span>
                          <span className="font-mono text-sm">{userDetails.user?.idNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">User ID:</span>
                          <span className="font-mono text-sm">{userDetails.user?.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Referral ID:</span>
                          <span>{userDetails.user?.referralId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Registration Date:</span>
                          <span>{userDetails.user?.created_at ? new Date(userDetails.user.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Account Status</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Status:</span>
                          <span>{getStatusBadge(userDetails.user?.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Role:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userDetails.user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userDetails.user?.role || 'user'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Current Balance:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(userDetails.user?.estimated_balance || 0)} RWF
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Profile Picture:</span>
                          <span>{userDetails.user?.profile_picture ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="dashboard-card">
                    <h4 className="text-lg font-semibold mb-4">Recent Transactions ({userDetails.transactions?.length || 0})</h4>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.transactions?.slice(0, 10).map((txn) => (
                            <tr key={txn.id}>
                              <td>{new Date(txn.created_at).toLocaleDateString()}</td>
                              <td>{txn.type}</td>
                              <td className="font-medium">{formatCurrency(txn.amount)} RWF</td>
                              <td>{getStatusBadge(txn.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(!userDetails.transactions || userDetails.transactions.length === 0) && (
                        <p className="text-center text-gray-500 py-8">No transactions found for this user</p>
                      )}
                    </div>
                  </div>

                  {/* User's Stakes */}
                  {userDetails.stakes && userDetails.stakes.length > 0 && (
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Active Stakes ({userDetails.stakes.length})</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Start Date</th>
                              <th>Amount</th>
                              <th>Period</th>
                              <th>Interest Rate</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.stakes.map((stake) => (
                              <tr key={stake.id}>
                                <td>{new Date(stake.start_date).toLocaleDateString()}</td>
                                <td className="font-medium">{formatCurrency(stake.amount)} RWF</td>
                                <td>{stake.stake_period} days</td>
                                <td>{stake.interest_rate * 100}%</td>
                                <td>{getStatusBadge(stake.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* User's Savings */}
                  {userDetails.savings && userDetails.savings.length > 0 && (
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Savings Accounts ({userDetails.savings.length})</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Created Date</th>
                              <th>Amount</th>
                              <th>Maturity Date</th>
                              <th>Interest Rate</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.savings.map((saving) => (
                              <tr key={saving.id}>
                                <td>{new Date(saving.created_at).toLocaleDateString()}</td>
                                <td className="font-medium">{formatCurrency(saving.amount)} RWF</td>
                                <td>{new Date(saving.maturity_date).toLocaleDateString()}</td>
                                <td>{saving.interest_rate * 100}%</td>
                                <td>{getStatusBadge(saving.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* User's Tree Plans */}
                  {userDetails.treePlans && userDetails.treePlans.length > 0 && (
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Tree Planting Investments ({userDetails.treePlans.length})</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Created Date</th>
                              <th>Amount</th>
                              <th>Trees Planted</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.treePlans.map((plan) => (
                              <tr key={plan.id}>
                                <td>{new Date(plan.created_at).toLocaleDateString()}</td>
                                <td className="font-medium">{formatCurrency(plan.amount)} RWF</td>
                                <td>{plan.trees_planted}</td>
                                <td>{getStatusBadge(plan.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* User's Bonuses */}
                  {userDetails.bonuses && userDetails.bonuses.length > 0 && (
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Referral Bonuses ({userDetails.bonuses.length})</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.bonuses.map((bonus) => (
                              <tr key={bonus.id}>
                                <td>{new Date(bonus.created_at).toLocaleDateString()}</td>
                                <td className="font-medium text-green-600">{formatCurrency(bonus.amount)} RWF</td>
                                <td>{bonus.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* User's Withdrawals */}
                  {userDetails.withdrawals && userDetails.withdrawals.length > 0 && (
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Withdrawal History ({userDetails.withdrawals.length})</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Request Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Processed Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.withdrawals.map((withdrawal) => (
                              <tr key={withdrawal.id}>
                                <td>{new Date(withdrawal.request_date).toLocaleDateString()}</td>
                                <td className="font-medium">{formatCurrency(withdrawal.amount)} RWF</td>
                                <td>{getStatusBadge(withdrawal.status)}</td>
                                <td>{withdrawal.processed_date ? new Date(withdrawal.processed_date).toLocaleDateString() : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* User's Loan Repayments */}
                  {userDetails.loanRepayments && userDetails.loanRepayments.length > 0 && (
                    <div className="dashboard-card">
                      <h4 className="text-lg font-semibold mb-4">Loan Repayment History ({userDetails.loanRepayments.length})</h4>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Payment Date</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.loanRepayments.map((repayment) => (
                              <tr key={repayment.id}>
                                <td>{new Date(repayment.payment_date).toLocaleDateString()}</td>
                                <td className="font-medium text-red-600">-{formatCurrency(repayment.amount)} RWF</td>
                                <td>{getStatusBadge(repayment.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Loading user details...</p>
                  <button
                    onClick={() => showSection('users')}
                    className="action-button mt-4"
                  >
                    Back to Users List
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {currentSection === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Notification Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">🔔 Notification Settings</h3>
                  <div className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                    Real-time enabled
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Browser Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Browser Notifications</h4>
                      <p className="text-sm text-gray-600">Receive notifications in your browser</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        Notification.permission === 'granted'
                          ? 'bg-green-100 text-green-800'
                          : Notification.permission === 'denied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {Notification.permission === 'granted' ? 'Enabled' :
                         Notification.permission === 'denied' ? 'Blocked' : 'Request'}
                      </span>
                      <button
                        onClick={requestNotificationPermission}
                        disabled={Notification.permission === 'granted'}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          Notification.permission === 'granted'
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {Notification.permission === 'granted' ? 'Granted' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {/* Sound Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Sound Notifications</h4>
                      <p className="text-sm text-gray-600">Play sound for new notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.soundEnabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          soundEnabled: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Auto Refresh */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto Refresh</h4>
                      <p className="text-sm text-gray-600">Automatically refresh dashboard data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.autoRefresh}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          autoRefresh: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Refresh Interval */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Refresh Interval</h4>
                      <span className="text-sm text-gray-600">{notificationSettings.refreshInterval}s</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="10"
                      value={notificationSettings.refreshInterval}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        refreshInterval: parseInt(e.target.value)
                      }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10s</span>
                      <span>120s</span>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Notification Types</h4>

                    {[
                      { key: 'userRegistrations', label: 'New User Registrations', icon: '👤' },
                      { key: 'transactionApprovals', label: 'Transaction Approvals', icon: '💳' },
                      { key: 'highValueTransactions', label: 'High-Value Transactions', icon: '💰' },
                      { key: 'systemAlerts', label: 'System Alerts', icon: '⚠️' }
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{icon}</span>
                          <span className="font-medium text-gray-900">{label}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[key]}
                            onChange={(e) => setNotificationSettings(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin Credentials */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">🔐 Admin Credentials</h3>
                <p className="text-gray-600 mb-6">
                  Manage your admin account credentials and security settings.
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">🔑 Change Admin Password</h4>
                    <p className="text-blue-700 text-sm mb-3">
                      Update your admin password regularly for security.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="font-semibold text-green-800 mb-2">👤 Update Admin Email</h4>
                    <p className="text-green-700 text-sm mb-3">
                      Change the admin email address for notifications.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200">
                      Update Email
                    </button>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <h4 className="font-semibold text-purple-800 mb-2">🔐 Two-Factor Authentication</h4>
                    <p className="text-purple-700 text-sm mb-3">
                      Enable 2FA for enhanced admin account security.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">⚙️ System Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚙️ System Configuration</h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    Configure system-wide settings and preferences.
                  </p>
                  <button className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors duration-200">
                    System Config
                  </button>
                </div>

                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h4 className="font-semibold text-indigo-800 mb-2">📊 Database Management</h4>
                  <p className="text-indigo-700 text-sm mb-3">
                    Manage database connections and backups.
                  </p>
                  <button className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Database Settings
                  </button>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <h4 className="font-semibold text-red-800 mb-2">🚨 Security Settings</h4>
                  <p className="text-red-700 text-sm mb-3">
                    Configure security policies and access controls.
                  </p>
                  <button className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Security Config
                  </button>
                </div>

                <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                  <h4 className="font-semibold text-teal-800 mb-2">📧 Email Configuration</h4>
                  <p className="text-teal-700 text-sm mb-3">
                    Set up email templates and SMTP settings.
                  </p>
                  <button className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Email Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Management Section */}
        {currentSection === 'withdrawals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Pending Withdrawals</h3>
                <div className="text-sm text-gray-600 bg-orange-100 px-3 py-2 rounded-lg">
                  {filteredPendingWithdrawals.length} pending withdrawal{filteredPendingWithdrawals.length !== 1 ? 's' : ''}
                </div>
              </div>

              {filteredPendingWithdrawals.length === 0 ? (
                <div className="text-center py-12">
                  <FaMoneyBillWave className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No matching pending withdrawals' : 'No pending withdrawals'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm ? 'Try adjusting your search criteria' : 'All withdrawals have been processed'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stake Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stake Period</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Withdrawal Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getPaginatedWithdrawals().map((withdrawal) => (
                            <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {withdrawal.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatCurrency(withdrawal.stake_amount)} RWF
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {withdrawal.stake_period} days
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                {formatCurrency(withdrawal.amount)} RWF
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(withdrawal.request_date).toLocaleString('en-RW', { timeZone: 'Africa/Kigali' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveWithdrawal(withdrawal.id, true)}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                                  >
                                    <FaCheck className="mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproveWithdrawal(withdrawal.id, false)}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                                  >
                                    <FaTimes className="mr-1" />
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <PaginationControls
                    currentPage={withdrawalsPage}
                    totalPages={totalWithdrawalsPages}
                    onPageChange={setWithdrawalsPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredPendingWithdrawals.length}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Company Assets Section */}
        {currentSection === 'assets' && (
          <div className="dashboard-grid">
            {/* Financial Overview */}
            <div className="dashboard-card">
              <h3>💰 Financial Overview</h3>
              {companyAssets ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Assets */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Assets</p>
                        <p className="text-2xl font-bold text-green-800">{(companyAssets.assets?.totalAssets || 0).toLocaleString()} RWF</p>
                        <p className="text-xs text-green-600 mt-1">User balances + Active stakes + Transactions</p>
                      </div>
                      <div className="text-green-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 font-medium">Total Liabilities</p>
                        <p className="text-2xl font-bold text-red-800">{(companyAssets.liabilities?.totalLiabilities || 0).toLocaleString()} RWF</p>
                        <p className="text-xs text-red-600 mt-1">Withdrawals + Bonuses paid</p>
                      </div>
                      <div className="text-red-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Net Assets */}
                  <div className={`p-4 rounded-lg border ${companyAssets.netAssets >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${companyAssets.netAssets >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Assets</p>
                        <p className={`text-2xl font-bold ${companyAssets.netAssets >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                          {companyAssets.netAssets?.toLocaleString() || 0} RWF
                        </p>
                        <p className={`text-xs mt-1 ${companyAssets.netAssets >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          Assets - Liabilities
                        </p>
                      </div>
                      <div className={companyAssets.netAssets >= 0 ? 'text-blue-500' : 'text-orange-500'}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading financial data...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-center">
                <FaTimes className="mr-2 text-red-500" />
                <div className="flex-1">
                  <strong className="font-medium">Error:</strong>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-dismiss messages */}
        {message && (
          <div className="fixed bottom-4 right-4 z-50 max-w-md">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-center">
                <FaCheck className="mr-2 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm">{message}</p>
                </div>
                <button
                  onClick={() => setMessage('')}
                  className="ml-4 text-green-500 hover:text-green-700 transition-colors"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default KediAdminDashboard;