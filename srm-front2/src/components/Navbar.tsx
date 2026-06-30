import { useState, useEffect } from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube } from 'react-icons/fa';
import { MessageCircle, LogOut, Menu, X, LayoutDashboard, Settings, FileText } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state from a single JWT-verified source
  const { user, isAuthenticated, refresh } = useAuth();
  const userRole = user?.role || '';
  const isLoggedIn = isAuthenticated;

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('nav')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      // Call backend to clear the HTTP-only cookie
      await api.post('/api/auth/logout');
    } catch {
      // Continue with client-side cleanup even if server call fails
    }
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    // Trigger context refresh so all components update immediately
    await refresh();
    window.dispatchEvent(new Event('authStateChanged'));
    navigate('/');
  };

  // Helper function to check if link is active
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-[#F5A051]' : '';
  };


  return (
    <header className={`w-full bg-white sticky top-0 z-50 ${scrolled ? 'shadow-md' : 'shadow-sm'} transition-all duration-300`}>
      {/* Top bar with social icons */}
      <div className="bg-gray-100 py-1 md:py-2 hidden sm:block">
        <div className="container mx-auto px-4 flex justify-end items-center">
          {/* Social Media Icons */}
          <div className="flex space-x-1 sm:space-x-2">
            <a href="#" className="bg-[#F5A051] text-white p-1.5 sm:p-2 rounded-md hover:bg-[#e08c3e] transition-all duration-300 transform hover:-translate-y-1">
              <FaFacebook size={16} />
            </a>
            <a href="#" className="bg-[#F5A051] text-white p-1.5 sm:p-2 rounded-md hover:bg-[#e08c3e] transition-all duration-300 transform hover:-translate-y-1">
              <FaTwitter size={16} />
            </a>
            <a href="#" className="bg-[#F5A051] text-white p-1.5 sm:p-2 rounded-md hover:bg-[#e08c3e] transition-all duration-300 transform hover:-translate-y-1">
              <FaLinkedin size={16} />
            </a>
            <a href="#" className="bg-[#F5A051] text-white p-1.5 sm:p-2 rounded-md hover:bg-[#e08c3e] transition-all duration-300 transform hover:-translate-y-1">
              <FaInstagram size={16} />
            </a>
            <a href="#" className="bg-[#F5A051] text-white p-1.5 sm:p-2 rounded-md hover:bg-[#e08c3e] transition-all duration-300 transform hover:-translate-y-1">
              <FaYoutube size={16} />
            </a>
            <a href="#" className="bg-[#F5A051] text-white p-1.5 sm:p-2 rounded-md hover:bg-[#e08c3e] transition-all duration-300 transform hover:-translate-y-1">
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-black text-white py-1 sm:py-2">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 relative">
            {/* Logo and Role-based Links */}
            <div className="flex items-center gap-4 md:gap-8">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">ICIUS</span>
                  <span className="text-xs md:text-sm font-medium ml-1 bg-[#F5A051] text-white px-1.5 py-0.5 rounded">2026</span>
                </Link>
              </div>

              {/* Role-based Dashboard Link (Logo and Role-based Links) */}
              {isLoggedIn && (
                <>
                  {userRole === 'Author' && (
                    <Link
                      to="/author-dashboard"
                      className={`flex items-center py-2 px-3 rounded-md transition-colors ${location.pathname === '/author-dashboard'
                        ? 'bg-[#F5A051] text-white'
                        : 'text-white hover:bg-gray-800'
                        }`}
                    >
                      <LayoutDashboard size={18} className="mr-2" />
                      <span className="font-medium">Author Dashboard</span>
                    </Link>
                  )}

                  {(userRole === 'Editor' || userRole === 'Admin') && (
                    <Link
                      to="/dashboard"
                      className={`flex items-center py-2 px-3 rounded-md transition-colors ${location.pathname === '/dashboard'
                        ? 'bg-[#F5A051] text-white'
                        : 'text-white hover:bg-gray-800'
                        }`}
                    >
                      <LayoutDashboard size={18} className="mr-2" />
                      <span className="font-medium">Editor Dashboard</span>
                    </Link>
                  )}

                  {userRole === 'Reviewer' && (
                    <Link
                      to="/reviewer"
                      className={`flex items-center py-2 px-3 rounded-md transition-colors ${location.pathname === '/reviewer'
                        ? 'bg-[#F5A051] text-white'
                        : 'text-white hover:bg-gray-800'
                        }`}
                    >
                      <LayoutDashboard size={18} className="mr-2" />
                      <span className="font-medium">Reviewer Dashboard</span>
                    </Link>
                  )}
                </>
              )}

              {/* Admin Panel Link (Only for Admin users) */}
              {isLoggedIn && userRole === 'Admin' && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/admin"
                    className={`flex items-center py-2 px-3 rounded-md transition-colors ${location.pathname === '/admin'
                      ? 'bg-red-600 text-white'
                      : 'text-white hover:bg-red-600'
                      }`}
                    title="Admin Panel - Manage Editors"
                  >
                    <Settings size={18} className="mr-2" />
                    <span className="font-medium">Admin</span>
                  </Link>
                  <Link
                    to="/admin/copyrights"
                    className={`flex items-center py-2 px-3 rounded-md transition-colors ${location.pathname === '/admin/copyrights'
                      ? 'bg-blue-600 text-white'
                      : 'text-white hover:bg-blue-600'
                      }`}
                    title="Manage Copyright Forms"
                  >
                    <FileText size={18} className="mr-2" />
                    <span className="font-medium">Copyright Management</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Desktop Navigation (Large screens only) */}
            <div className="hidden lg:block flex-grow mx-4">
              <ul className="flex items-center justify-center space-x-1 xl:space-x-4">
                <li><Link to="/" className={`py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base ${isActive('/')}`}>Home</Link></li>
                <li><Link to="/call-for-papers" className={`py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base ${isActive('/call-for-papers')}`}>Call For Papers</Link></li>
                {isLoggedIn && (
                  <li><Link to="/paper-submission" className={`py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base ${isActive('/paper-submission')}`}>Paper Submission</Link></li>
                )}
                <li><Link to="/Registrations" className="py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base">Registrations</Link></li>
                <li><Link to="/commitee" className={`py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base ${isActive('/commitee')}`}>Committee</Link></li>
                <li><Link to="/keynote-speakers" className={`py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base ${isActive('/keynote-speakers')}`}>Keynote speakers</Link></li>
                <li><Link to="/contact" className={`py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base ${isActive('/contact')}`}>Contact</Link></li>
                <li><Link to="/venue" className="py-2 px-2 hover:text-[#F5A051] transition-colors text-sm xl:text-base">Venue</Link></li>
              </ul>
            </div>

            {/* User Actions */}
            <div className="flex items-center">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
                >
                  <LogOut size={16} className="mr-1.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center bg-[#F5A051] hover:bg-[#e08c3e] text-white px-3 sm:px-4 py-1.5 rounded-md transition-colors"
                >
                  <span>Login / Register</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                className="ml-2 md:ml-4 lg:hidden flex items-center justify-center p-2 rounded-md text-white hover:bg-gray-800 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <ul className="flex flex-col space-y-1 py-2">
              <li>
                <Link
                  to="/"
                  className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/')}`}
                >
                  Home
                </Link>
              </li>

              {/* Dashboard links in mobile menu based on role */}
              {isLoggedIn && (
                <>
                  {(userRole === 'Editor' || userRole === 'Admin') && (
                    <li>
                      <Link
                        to="/dashboard"
                        className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/dashboard')}`}
                      >
                        <div className="flex items-center">
                          <LayoutDashboard size={16} className="mr-2" />
                          Editor Dashboard
                        </div>
                      </Link>
                    </li>
                  )}

                  {userRole === 'Reviewer' && (
                    <li>
                      <Link
                        to="/reviewer"
                        className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/reviewer')}`}
                      >
                        <div className="flex items-center">
                          <LayoutDashboard size={16} className="mr-2" />
                          Reviewer Dashboard
                        </div>
                      </Link>
                    </li>
                  )}

                  {userRole === 'Author' && (
                    <li>
                      <Link
                        to="/author-dashboard"
                        className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/author-dashboard')}`}
                      >
                        <div className="flex items-center">
                          <LayoutDashboard size={16} className="mr-2" />
                          Author Dashboard
                        </div>
                      </Link>
                    </li>
                  )}

                  {/* Admin Panel links in mobile menu (only for Admin users) */}
                  {userRole === 'Admin' && (
                    <>
                      <li>
                        <Link
                          to="/admin"
                          className={`block py-2.5 px-4 hover:bg-red-600 rounded-md transition-colors ${isActive('/admin')}`}
                        >
                          <div className="flex items-center">
                            <Settings size={16} className="mr-2" />
                            Admin Panel
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/copyrights"
                          className={`block py-2.5 px-4 hover:bg-blue-600 rounded-md transition-colors ${isActive('/admin/copyrights')}`}
                        >
                          <div className="flex items-center">
                            <FileText size={16} className="mr-2" />
                            Copyright Management
                          </div>
                        </Link>
                      </li>
                    </>
                  )}
                </>
              )}

              <li>
                <Link
                  to="/call-for-papers"
                  className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/call-for-papers')}`}
                >
                  Call For Papers
                </Link>
              </li>

              {isLoggedIn && (
                <li>
                  <Link
                    to="/paper-submission"
                    className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/paper-submission')}`}
                  >
                    Paper Submission
                  </Link>
                </li>
              )}

              <li>
                <Link
                  to="/Registrations"
                  className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/Registrations')}`}
                >
                  Registrations
                </Link>
              </li>

              <li>
                <Link
                  to="/commitee"
                  className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/commitee')}`}
                >
                  Committee
                </Link>
              </li>

              <li>
                <Link
                  to="/keynote-speakers"
                  className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/keynote-speakers')}`}
                >
                  Keynote Speakers
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/contact')}`}
                >
                  Contact
                </Link>
              </li>

              <li>
                <Link
                  to="/venue"
                  className={`block py-2.5 px-4 hover:bg-gray-800 rounded-md transition-colors ${isActive('/venue')}`}
                >
                  Venue
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;