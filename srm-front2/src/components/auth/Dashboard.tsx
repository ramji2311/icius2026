import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import Swal from 'sweetalert2';
import PageTransition from '../PageTransition';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user from backend using HTTP-only cookie
        const meResponse = await api.get('/api/auth/me');

        if (!meResponse.data?.success || !meResponse.data?.user) {
          throw new Error('Not authenticated');
        }

        setUserData(meResponse.data.user);

        // Fetch user submissions
        await fetchSubmissions();
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Clear client-side auth flag so Navbar updates
        localStorage.removeItem('isAuthenticated');

        Swal.fire({
          icon: 'info',
          title: 'Session Expired',
          text: 'Please log in again to continue',
          confirmButtonColor: '#F5A051'
        }).then(() => {
          navigate('/login');
          window.location.reload();
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/api/user-submission');
      
      if (response.data.success) {
        setSubmissions(response.data.submissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      // Don't redirect here, just show empty submissions
    }
  };
  
  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F5A051',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('isAuthenticated');

        // Force a re-render of the navbar by triggering the custom event
        window.dispatchEvent(new Event('authStateChanged'));
        
        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been logged out successfully',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/login');
        });
      }
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F5A051]"></div>
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F5A051] hover:bg-[#e08c3e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F5A051]"
            >
              Logout
            </button>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome, {userData?.username || userData?.email}</h2>
              
              {/* Submissions section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Submissions</h3>
                
                {submissions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((sub: any) => (
                          <tr key={sub.submissionId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.submissionId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.paperTitle}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                sub.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' : 
                                sub.status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                className="text-[#F5A051] hover:text-[#e08c3e]"
                                onClick={() => navigate(`/paper-status/${sub.submissionId}`)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">You haven't submitted any papers yet.</p>
                    <button
                      onClick={() => navigate('/submit-paper')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F5A051] hover:bg-[#e08c3e]"
                    >
                      Submit a Paper
                    </button>
                  </div>
                )}
              </div>
              
              {/* Quick links section */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Submit a Paper</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Submit your research paper for the upcoming conference.
                    </p>
                    <button
                      onClick={() => navigate('/submit-paper')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F5A051] hover:bg-[#e08c3e]"
                    >
                      Submit Paper
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Check Submission Status</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Check the status of your paper submissions.
                    </p>
                    <button
                      onClick={() => navigate('/my-submissions')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F5A051] hover:bg-[#e08c3e]"
                    >
                      View Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default Dashboard;