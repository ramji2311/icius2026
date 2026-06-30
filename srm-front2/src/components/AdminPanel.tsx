import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';
import { UserPlus, Trash2, Mail, User, Lock, AlertCircle, Check, Filter, MessageCircle, Send, X, FileText, Upload } from 'react-feather';
import Swal from 'sweetalert2';
import api from '../config/api';
import { useWebSocket } from '../context/WebSocketContext';
import PageTransition from './PageTransition';
import AdminPaymentVerification from './AdminPaymentVerification';
import AdminSupportMessages from './AdminSupportMessages';
import AdminSelectedUsers from './AdminSelectedUsers';
import AdminPdfManagement from './AdminPdfManagement';
import AdminDashboardStats from './AdminDashboardStats';
import AdminDatabase from './AdminDatabase';
import AdminSidebar from './AdminSidebar';
import PaperHistoryTimeline from './PaperHistoryTimeline';
import { History as HistoryIcon, Search as SearchIcon, Link2, RotateCcw } from 'lucide-react';

const AdminPanel = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editors, setEditors] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    username: '',
    password: ''
  });

  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [messagingEditor, setMessagingEditor] = useState<any | null>(null);
  const [editorMessage, setEditorMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [papers, setPapers] = useState<any[]>([]);


  const [trackingSubmissionId, setTrackingSubmissionId] = useState('');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);




  const { on, off, isConnected } = useWebSocket();

  // Memoized filtered users for performance
  const filteredUsers = useMemo(() => {
    return allUsers
      .filter((user) => roleFilter === 'All' || user.role === roleFilter)
      .filter((user) =>
        searchTerm === '' ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allUsers, roleFilter, searchTerm]);

  // Memoized filtered papers for performance
  const filteredPapers = useMemo(() => {
    return papers
      .filter(p => roleFilter === 'All' || p.status === roleFilter)
      .filter(p => !searchTerm || p.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [papers, roleFilter, searchTerm]);

  useEffect(() => {
    const initializeAdmin = async () => {
      await checkAdminAccess();
    };
    initializeAdmin();
  }, []);


  useEffect(() => {
    if (!isAdmin) return;

    // Listen for system-wide updates
    const handlePaperUpdate = (data: any) => {
      console.log('WebSocket: Paper updated', data);
      fetchAdminStats();
      fetchAdminPapers();
    };

    const handleNewSubmission = (data: any) => {
      console.log('WebSocket: New paper submission', data);
      fetchAdminStats();
      fetchAdminPapers();
      // Show notification
      Swal.fire({
        icon: 'info',
        title: 'New Paper Submission!',
        text: `Paper "${data.paperTitle || 'New Paper'}" has been submitted.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    };

    const handleNewUser = (data: any) => {
      console.log('WebSocket: New user registered', data);
      fetchAdminStats();
    };

    const handleStatusChange = (data: any) => {
      console.log('WebSocket: Status changed', data);
      fetchAdminStats();
      fetchAdminPapers();
    };

    on('paper:updated', handlePaperUpdate);
    on('paper:new', handleNewSubmission);
    on('user:new', handleNewUser);
    on('paper:status-changed', handleStatusChange);

    return () => {
      off('paper:updated', handlePaperUpdate);
      off('paper:new', handleNewSubmission);
      off('user:new', handleNewUser);
      off('paper:status-changed', handleStatusChange);
    };
  }, [isAdmin, on, off]);

  // Fetch editors when admin is verified
  useEffect(() => {
    if (isAdmin) {
      fetchEditors();
      fetchAdminStats();
      fetchAdminPapers();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      console.log('=== ADMIN ACCESS CHECK ===');

      // Verify with backend using cookie-based auth
      console.log('Verifying with backend...');
      const response = await api.get(`/api/admin/users`);

      console.log('Backend verification response:', response.data);

      if (response.data.success) {
        console.log('Admin access verified ✓');
        setIsAdmin(true);
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Admin access check failed:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        Swal.fire({
          icon: 'info',
          title: 'Access Denied',
          text: error.response?.data?.message || 'You do not have admin permissions',
          confirmButtonColor: '#F5A051'
        }).then(() => {
          navigate('/login');
        });
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Access Denied',
          text: error.response?.data?.message || 'You do not have admin permissions',
          confirmButtonColor: '#F5A051'
        }).then(() => {
          navigate('/dashboard');
        });
      }
    }
  };

  const fetchEditors = async () => {
    try {
      setIsLoading(true);

      console.log('🔍 Fetching editors...');

      const response = await api.get(`/api/admin/editors`);

      console.log('📡 Raw response:', response.data);
      console.log('Response count:', response.data.count);
      console.log('Response editors:', response.data.editors);

      // Log debug info from backend
      if (response.data.debug) {
        console.log('🐛 Backend Debug Info:');
        console.log('  Total users in DB:', response.data.debug.totalUsers);
        console.log('  Roles in DB:', response.data.debug.rolesInDB);
      }

      if (response.data.success) {
        const editorsList = response.data.editors || [];
        console.log(` Successfully loaded ${editorsList.length} editors`);
        setEditors(editorsList);

        // If no editors found but DB has users, log warning
        if (editorsList.length === 0 && response.data.debug?.totalUsers > 0) {
          console.warn('⚠️  WARNING: Database has users but no editors found!');
          console.warn('Debug roles:', response.data.debug?.rolesInDB);
        }
      } else {
        console.error('❌ API returned success: false', response.data);
        Swal.fire({
          icon: 'info',
          title: 'Failed to Load Editors',
          text: response.data.message || 'Could not load editors',
          confirmButtonColor: '#F5A051'
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching editors:');
      console.error('  Message:', error.message);
      console.error('  Status:', error.response?.status);
      console.error('  Data:', error.response?.data);

      Swal.fire({
        icon: 'info',
        title: 'Failed to Fetch Editors',
        text: error.response?.data?.message || error.message || 'Could not load editors',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const response = await api.get(`/api/admin/dashboard-stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchAdminPapers = async () => {
    try {
      const response = await api.get(`/api/editor/papers`);
      if (response.data.success) {
        setPapers(response.data.papers);
      }
    } catch (error) {
      console.error('Error fetching admin papers:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/admin/users`);

      if (response.data.success) {
        const usersList = response.data.users || [];
        setAllUsers(usersList);
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Failed to Load Users',
          text: response.data.message || 'Could not load users',
          confirmButtonColor: '#F5A051'
        });
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      Swal.fire({
        icon: 'info',
        title: 'Failed to Fetch Users',
        text: error.response?.data?.message || error.message || 'Could not load users',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Delete User?',
        text: `Are you sure you want to delete ${userEmail}? This action cannot be undone.`,
        confirmButtonColor: '#F5A051',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const response = await api.delete(
          `/api/admin/users/${userId}`
        );

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: `User ${userEmail} has been deleted`,
            confirmButtonColor: '#F5A051'
          });

          // Refresh users list
          if (activeTab === 'users') {
            fetchAllUsers();
          } else {
            fetchEditors();
          }
        }
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      Swal.fire({
        icon: 'info',
        title: 'Failed to Delete',
        text: error.response?.data?.message || 'Could not delete user',
        confirmButtonColor: '#F5A051'
      });
    }
  };

  const handleCreateEditor = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!createFormData.email || !createFormData.username || !createFormData.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all fields',
        confirmButtonColor: '#F5A051'
      });
      return;
    }

    if (createFormData.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'Password must be at least 6 characters',
        confirmButtonColor: '#F5A051'
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post(
        `/api/admin/editors`,
        createFormData
      );

      if (response.data.success) {
        const emailMessage = response.data.emailSent
          ? `\n\n Credentials email has been sent to ${createFormData.email}`
          : `\n\n⚠️  Note: Email could not be sent (editor created successfully)`;

        Swal.fire({
          icon: 'success',
          title: 'Editor Created Successfully',
          html: `<div style="text-align: left;">
                   <p><strong>${createFormData.email}</strong> has been created as an Editor</p>
                   <p style="color: #F5A051; font-weight: bold;">${emailMessage}</p>
                 </div>`,
          confirmButtonColor: '#F5A051'
        });

        // Reset form
        setCreateFormData({ email: '', username: '', password: '' });
        setShowCreateForm(false);

        // Refresh editors list
        fetchEditors();
      }
    } catch (error: any) {
      console.error('Error creating editor:', error);
      Swal.fire({
        icon: 'info',
        title: 'Failed to Create Editor',
        text: error.response?.data?.message || 'Could not create editor',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEditor = async (editorId: string, editorEmail: string) => {
    try {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Delete Editor?',
        text: `Are you sure you want to delete ${editorEmail}? This action cannot be undone.`,
        confirmButtonColor: '#F5A051',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setDeleteLoading(editorId);
        const response = await api.delete(
          `/api/admin/users/${editorId}`
        );

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: `Editor ${editorEmail} has been deleted`,
            confirmButtonColor: '#F5A051'
          });

          // Refresh editors list
          fetchEditors();
        }
      }
    } catch (error: any) {
      console.error('Error deleting editor:', error);
      Swal.fire({
        icon: 'info',
        title: 'Failed to Delete',
        text: error.response?.data?.message || 'Could not delete editor',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setDeleteLoading(null);
    }
  };
  const handleSendMessageToEditor = async () => {
    if (!editorMessage.trim() || !messagingEditor) return;

    setIsSendingMessage(true);
    try {
      const response = await api.post(`/api/admin/editors/message`, {
        editorId: messagingEditor._id,
        message: editorMessage
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Sent!',
          text: 'Message successfully sent to ' + messagingEditor.username,
          confirmButtonColor: '#F5A051'
        });
        setMessagingEditor(null);
        setEditorMessage('');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Swal.fire({
        icon: 'info',
        title: 'Failed to Send',
        text: error.response?.data?.message || 'Could not send message',
        confirmButtonColor: '#F5A051'
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-gray-50 min-w-0">
        {/* Static Sidebar */}
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'editors') fetchEditors();
            if (tab === 'users') fetchAllUsers();
          }} 
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto min-h-0 lg:h-screen pt-16 lg:pt-0 px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          <div className={activeTab === 'database' ? 'h-full flex flex-col' : 'max-w-5xl mx-auto'}>
            {/* Header / Stats row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-gray-900 capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h2>
                <p className="text-sm text-gray-500 font-medium">Administration & Control Panel</p>
              </div>

              {stats && activeTab !== 'overview' && (
                <div className="flex flex-wrap gap-2">
                  <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-blue-50 flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-600 uppercase">Papers</span>
                    <span className="text-xs font-black text-gray-900">{stats.papers.total}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-green-50 flex items-center gap-2">
                    <span className="text-[9px] font-black text-green-600 uppercase">Paid</span>
                    <span className="text-xs font-black text-gray-900">{stats.papers.accepted}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-orange-100 flex items-center gap-2">
                    <span className="text-[9px] font-black text-orange-600 uppercase">Users</span>
                    <span className="text-xs font-black text-gray-900">{stats.users.total}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="min-h-0">
              {activeTab === 'overview' && (
                <AdminDashboardStats />
              )}

          {/* Editors Tab - Two Column Layout */}
          {activeTab === 'editors' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN - Create Editor or Messaging Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                {!messagingEditor ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900">Create New Editor</h2>
                      <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#F5A051] text-white rounded-lg hover:bg-[#e08c3e] transition-colors font-medium"
                      >
                        <UserPlus className="w-5 h-5" />
                        {showCreateForm ? 'Cancel' : 'Add Editor'}
                      </button>
                    </div>

                    {showCreateForm && (
                      <form onSubmit={handleCreateEditor} className="space-y-4">
                        <div className="space-y-4">
                          {/* Email Field */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Mail className="w-4 h-4 inline mr-2" />
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={createFormData.email}
                              onChange={(e) =>
                                setCreateFormData({ ...createFormData, email: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                              placeholder="editor@example.com"
                            />
                          </div>

                          {/* Username Field */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <User className="w-4 h-4 inline mr-2" />
                              Username
                            </label>
                            <input
                              type="text"
                              required
                              value={createFormData.username}
                              onChange={(e) =>
                                setCreateFormData({ ...createFormData, username: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                              placeholder="editor_name"
                            />
                          </div>

                          {/* Password Field */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              <Lock className="w-4 h-4 inline mr-2" />
                              Password
                            </label>
                            <input
                              type="password"
                              required
                              value={createFormData.password}
                              onChange={(e) =>
                                setCreateFormData({ ...createFormData, password: e.target.value })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                              placeholder="Min 6 characters"
                              minLength={6}
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-6 py-2 bg-[#F5A051] text-white rounded-lg font-medium transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#e08c3e]'
                              }`}
                          >
                            {isLoading ? 'Creating...' : 'Create Editor'}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  <>
                    {/* Messaging Interface */}
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-[#F5A051]" />
                        Message Editor
                      </h2>
                      <button
                        onClick={() => {
                          setMessagingEditor(null);
                          setEditorMessage('');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg border-2 border-[#F5A051]">
                        <p className="text-sm font-medium text-gray-700 mb-1">To:</p>
                        <p className="text-lg font-semibold text-gray-900">{messagingEditor.username}</p>
                        <p className="text-sm text-gray-600">{messagingEditor.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Message
                        </label>
                        <textarea
                          className="w-full h-64 border-2 rounded-lg p-4 text-sm focus:border-[#F5A051] focus:ring-4 focus:ring-[#F5A051]/10 outline-none transition resize-none bg-white"
                          placeholder="Type your message here..."
                          value={editorMessage}
                          onChange={(e) => setEditorMessage(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setMessagingEditor(null);
                            setEditorMessage('');
                          }}
                          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSendMessageToEditor}
                          disabled={isSendingMessage || !editorMessage.trim()}
                          className="flex-1 px-6 py-3 bg-[#F5A051] text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#e08c3e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          {isSendingMessage ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN - Editors List Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Current Editors</h2>

                {isLoading && editors.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading editors...</p>
                  </div>
                ) : editors.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No editors created yet</p>
                    <p className="text-gray-500">Click "Add Editor" above to create one</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editors.map((editor) => (
                      <div
                        key={editor._id}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        {/* Editor Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{editor.username}</h3>
                            <p className="text-sm text-gray-600 mt-1">{editor.email}</p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <Check className="w-4 h-4 mr-1" />
                            Editor
                          </span>
                        </div>

                        {/* Editor Stats */}
                        <div className="space-y-2 mb-3 pb-3 border-b border-blue-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Created:</span>{' '}
                            {new Date(editor.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Status:</span>{' '}
                            <span className="text-green-600">Verified ✓</span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => setMessagingEditor(editor)}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </button>
                          <button
                            onClick={() => handleDeleteEditor(editor._id, editor.email)}
                            disabled={deleteLoading === editor._id}
                            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-70 text-sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deleteLoading === editor._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Editors Count */}
                {editors.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Total Editors: <span className="font-semibold text-gray-900">{editors.length}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab - Two Column Layout */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN - Filters & Search */}
              <div className="lg:col-span-1">
                {/* Role Filter */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Role</h2>
                  <div className="space-y-2">
                    {['All', 'Admin', 'Editor', 'Reviewer', 'Author'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${roleFilter === role
                          ? 'bg-[#F5A051] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Filter className="w-4 h-4 inline mr-2" />
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Users</h2>
                  <input
                    type="text"
                    placeholder="Email or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051] focus:border-[#F5A051]"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN - Users List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">All Users</h2>

                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No users found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredUsers.map((user) => (
                          <div
                            key={user._id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${user.role === 'Admin' ? 'bg-red-50 border-red-200' :
                              user.role === 'Editor' ? 'bg-blue-50 border-blue-200' :
                                user.role === 'Reviewer' ? 'bg-green-50 border-green-200' :
                                  'bg-yellow-50 border-yellow-200'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{user.username}</h3>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                  </div>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                                    user.role === 'Editor' ? 'bg-blue-100 text-blue-800' :
                                      user.role === 'Reviewer' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {user.role}
                                  </span>
                                </div>
                                <div className="mt-2 flex gap-4 text-xs text-gray-600">
                                  <span>📅 {new Date(user.createdAt).toLocaleDateString()}</span>
                                  <span>{user.verified ? ' Verified' : '⏳ Pending'}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteUser(user._id, user.email)}
                                disabled={deleteLoading === user._id}
                                className="ml-4 flex items-center px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-70 text-sm whitespace-nowrap"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {deleteLoading === user._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Users Count */}
                  {allUsers.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Displaying: <span className="font-semibold text-gray-900">{filteredUsers.length}</span> / {allUsers.length} users
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Verification Tab */}
          {activeTab === 'payments' && (
            <AdminPaymentVerification />
          )}

          {/* Support Messages Tab */}
          {activeTab === 'support' && (
            <AdminSupportMessages />
          )}

          {/* Selected Users Tab */}
          {activeTab === 'selected' && (
            <AdminSelectedUsers />
          )}

          {/* PDF Management Tab */}
          {activeTab === 'pdfs' && (
            <AdminPdfManagement />
          )}

          {/* All Submissions Tab */}
          {activeTab === 'allSubmissions' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">Global Paper Repository</h2>
                    <p className="text-gray-500">Full list of all research papers submitted to ICIUS 2026.</p>
                  </div>
                  <div className="flex gap-4">
                    <select
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Under Review">Under Review</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">ID</th>
                        <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Paper Title</th>
                        <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Author / Email</th>
                        <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredPapers.map((paper) => (
                          <tr key={paper._id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-4 py-4">
                              <span className="text-xs font-black bg-blue-50 text-blue-600 px-2 py-1 rounded">{paper.submissionId}</span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-bold text-gray-800 line-clamp-1">{paper.paperTitle}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{paper.category}</p>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm font-bold text-gray-900">{paper.authorName}</p>
                              <p className="text-xs text-blue-500 font-medium">{paper.email}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${paper.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                paper.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>{paper.status}</span>
                            </td>
                            <td className="px-4 py-4 text-xs font-bold text-gray-500">
                              {new Date(paper.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => {
                                  setActiveTab('tracking');
                                  setTrackingSubmissionId(paper.submissionId);
                                  setSelectedTrackingId(paper.submissionId);
                                }}
                                className="p-2 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all transform hover:scale-110"
                              >
                                <HistoryIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {papers.length === 0 && (
                  <div className="text-center py-20">
                    <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">No submissions found in the database.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full database browser — Admin only API */}
          {activeTab === 'database' && (
            <AdminDatabase />
          )}

          {/* Paper Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HistoryIcon className="w-6 h-6 text-blue-600" />
                  Paper Operation History & Tracking
                </h2>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm transition-all shadow-sm"
                      placeholder="Enter Submission ID (e.g. ED001/IT005) or Author Email..."
                      value={trackingSubmissionId}
                      onChange={(e) => setTrackingSubmissionId(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setSelectedTrackingId(trackingSubmissionId)}
                    disabled={!trackingSubmissionId.trim()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-black uppercase tracking-tighter shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                  >
                    <SearchIcon className="w-4 h-4" />
                    Trace Paper
                  </button>
                </div>

                {selectedTrackingId ? (
                  <div className="mt-8 border-t pt-8">
                    <PaperHistoryTimeline submissionId={selectedTrackingId} />
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Enter a Submission ID above to view its full operation history</p>
                    <p className="text-gray-400 text-sm mt-2">You can track file uploads (v1, v2), status changes, and assignments.</p>
                  </div>
                )}
              </div>
            </div>
          )}

            </div> 
          </div>
        </main>
      </div>
    </PageTransition>
  );
});

export default AdminPanel;
