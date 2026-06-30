import React, { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import api from '../config/api';
import Swal from 'sweetalert2';



interface ListenerRegistration {
    _id: string;
    name: string;
    email: string;
    institution: string;
    address: string;
    country: string;
    registrationCategory: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentScreenshot: string;
    isScisMember: boolean;
    scisMembershipId?: string;
    paymentStatus: 'pending' | 'verified' | 'rejected';
    registrationNumber?: string;
    verifiedAt?: Date;
    verifiedByName?: string;
    rejectionReason?: string;
    createdAt: Date;
}

interface Stats {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
}

const AdminListenerRegistrations: React.FC = () => {
    const [filteredRegistrations, setFilteredRegistrations] = useState<ListenerRegistration[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchRegistrations();
    }, [statusFilter, searchQuery]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);

            const response = await api.get('/api/listener/admin/all-listeners', {
                params: {
                    status: statusFilter,
                    search: searchQuery
                }
            });

            if (response.data.success) {
                setFilteredRegistrations(response.data.registrations);
                setStats(response.data.stats);
            }
        } catch (error: any) {
            console.error('Error fetching listener registrations:', error);
            Swal.fire({
                icon: 'info',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch listener registrations',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
        try {
            const result = await Swal.fire({
                title: `${status === 'verified' ? 'Verify' : 'Reject'} Registration?`,
                text: status === 'rejected' ? 'Please provide a reason for rejection' : 'Are you sure you want to verify this registration?',
                input: status === 'rejected' ? 'textarea' : undefined,
                inputPlaceholder: status === 'rejected' ? 'Enter rejection reason...' : undefined,
                inputValidator: status === 'rejected' ? (value: any) => {
                    if (!value) {
                        return 'Rejection reason is required!';
                    }
                    return null;
                } : undefined,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: status === 'verified' ? '#10b981' : '#dc2626',
                cancelButtonColor: '#6b7280',
                confirmButtonText: status === 'verified' ? 'Yes, Verify' : 'Yes, Reject'
            });

            if (result.isConfirmed) {
                await api.put(
                    `/api/listener/admin/verify-listener/${id}`,
                    {
                        status,
                        rejectionReason: result.value || undefined,
                        notes: status === 'verified' ? 'Payment verified by admin' : undefined
                    }
                );

                Swal.fire({
                    icon: 'success',
                    title: `Registration ${status === 'verified' ? 'Verified' : 'Rejected'}!`,
                    text: `The listener registration has been ${status} successfully.`,
                    confirmButtonColor: '#10b981'
                });

                fetchRegistrations();
            }
        } catch (error: any) {
            console.error('Error verifying registration:', error);
            Swal.fire({
                icon: 'info',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to update registration status',
                confirmButtonColor: '#dc2626'
            });
        }
    };

    const viewScreenshot = (screenshot: string) => {
        setSelectedImage(screenshot);
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            verified: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading listener registrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-full min-w-0">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center mb-2">
                    <Users className="mr-3 text-blue-600" size={32} />
                    Listener Registrations
                </h1>
                <p className="text-gray-600">Manage and verify listener/attendee registrations</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Listeners</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <Users className="text-blue-500" size={40} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Pending</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
                        </div>
                        <Filter className="text-yellow-500" size={40} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Verified</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.verified}</p>
                        </div>
                        <CheckCircle className="text-green-500" size={40} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Rejected</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.rejected}</p>
                        </div>
                        <XCircle className="text-red-500" size={40} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by email, name, or registration number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Listener Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution & Country
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No listener registrations found
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((registration) => (
                                    <tr key={registration._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-800">{registration.name}</p>
                                                <p className="text-sm text-gray-600">{registration.email}</p>
                                                {registration.registrationNumber && (
                                                    <p className="text-xs text-blue-600 font-mono mt-1">
                                                        {registration.registrationNumber}
                                                    </p>
                                                )}
                                                {registration.isScisMember && (
                                                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                                        SCIS Member
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{registration.institution}</p>
                                                <p className="text-sm text-gray-600">{registration.country}</p>
                                                <p className="text-xs text-gray-500 mt-1">{registration.address}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {registration.currency === 'INR' ? '₹' : registration.currency === 'IDR' ? 'Rp ' : '$'}
                                                    {registration.amount.toLocaleString()}
                                                </p>
                                                <p className="text-sm text-gray-600">{registration.paymentMethod}</p>
                                                {registration.transactionId && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        TXN: {registration.transactionId}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {new Date(registration.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(registration.paymentStatus)}`}>
                                                {registration.paymentStatus.toUpperCase()}
                                            </span>
                                            {registration.verifiedAt && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    By: {registration.verifiedByName}
                                                </p>
                                            )}
                                            {registration.rejectionReason && (
                                                <p className="text-xs text-red-600 mt-2">
                                                    Reason: {registration.rejectionReason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                {registration.paymentScreenshot && (
                                                    <button
                                                        onClick={() => viewScreenshot(registration.paymentScreenshot)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Screenshot"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                {registration.paymentStatus === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerify(registration._id, 'verified')}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Verify"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerify(registration._id, 'rejected')}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Screenshot Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
                        >
                            <XCircle size={24} />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Payment Screenshot"
                            className="max-w-full max-h-[90vh] rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminListenerRegistrations;
