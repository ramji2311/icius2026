import { useEffect, useState, useRef } from 'react';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import api from '../config/api';
import Swal from 'sweetalert2';
import { Loader, AlertCircle, TrendingUp, DollarSign, FileText, CheckCircle, Download } from 'lucide-react';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

const FIXED_EXP = Number(import.meta.env.VITE_CONFERENCE_FIXED_EXPENSE) || 0;

const AdminDashboardStats = () => {
    const [stats, setStats] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [collegeStats, setCollegeStats] = useState<any[]>([]);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [institutionSearch, setInstitutionSearch] = useState('');
    const [papers, setPapers] = useState<any[]>([]);
    const [papersMeta, setPapersMeta] = useState({ page: 1, pages: 1, total: 0 });
    const [papersPage, setPapersPage] = useState(1);
    const [papersLoading, setPapersLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const filtersRef = useRef({ category: '', search: '' });
    const [collegeBarMode, setCollegeBarMode] = useState<'count' | 'amount' | 'paymentStatus'>('count');
    const [exportingExcel, setExportingExcel] = useState(false);

    useEffect(() => {
        const run = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [dash, sRes] = await Promise.all([
                    api.get('/api/admin/dashboard-stats'),
                    api.get('/api/admin/analytics/summary')
                ]);
                if (dash.data.success) setStats(dash.data.stats);
                if (sRes.data.success) setSummary(sRes.data);
                const cRes = await api.get('/api/admin/analytics/by-institution');
                if (cRes.data.success) setCollegeStats(cRes.data.collegeStats || []);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || 'Error connecting to server');
            } finally {
                setIsLoading(false);
            }
        };
        run();
    }, []);

    useEffect(() => {
        if (!stats) return;
        let cancelled = false;
        (async () => {
            const params: Record<string, string> = {};
            if (categoryFilter.trim()) params.category = categoryFilter.trim();
            if (institutionSearch.trim()) params.search = institutionSearch.trim();
            try {
                const [sRes, cRes] = await Promise.all([
                    api.get('/api/admin/analytics/summary'),
                    api.get('/api/admin/analytics/by-institution', { params })
                ]);
                if (cancelled) return;
                if (sRes.data.success) setSummary(sRes.data);
                if (cRes.data.success) setCollegeStats(cRes.data.collegeStats || []);
            } catch (e) {
                console.error(e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [stats, categoryFilter, institutionSearch]);

    useEffect(() => {
        if (!stats) return;
        const filtersChanged =
            filtersRef.current.category !== categoryFilter ||
            filtersRef.current.search !== institutionSearch;
        if (filtersChanged) {
            filtersRef.current = { category: categoryFilter, search: institutionSearch };
            if (papersPage !== 1) {
                setPapersPage(1);
                return;
            }
        }
        const pageToUse = papersPage;
        let cancelled = false;
        (async () => {
            setPapersLoading(true);
            try {
                const params: Record<string, string> = {
                    page: String(pageToUse),
                    limit: '15'
                };
                if (categoryFilter.trim()) params.category = categoryFilter.trim();
                if (institutionSearch.trim()) params.search = institutionSearch.trim();
                const res = await api.get('/api/admin/analytics/papers', { params });
                if (cancelled) return;
                if (res.data.success) {
                    setPapers(res.data.papers || []);
                    setPapersMeta({
                        page: res.data.page,
                        pages: res.data.pages,
                        total: res.data.total
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setPapersLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [stats, categoryFilter, institutionSearch, papersPage]);

    const applyFilters = () => {
        setPapersPage(1);
    };

    const downloadAcceptedExcel = async () => {
        setExportingExcel(true);
        try {
            const res = await api.get('/api/admin/analytics/export-accepted-excel', {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `accepted-papers-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            const msg =
                err.response?.data instanceof Blob
                    ? await err.response.data.text().catch(() => 'Export failed')
                    : err.response?.data?.message || err.message || 'Export failed';
            Swal.fire({ icon: 'info', title: 'Download failed', text: String(msg).slice(0, 500) });
        } finally {
            setExportingExcel(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader className="w-12 h-12 text-[#F5A051] animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Assembling Insights...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">Oops! Something went wrong</h3>
                <p className="text-red-600">{error || 'Unable to retrieve statistics at this moment.'}</p>
            </div>
        );
    }

    const cs = collegeStats.length ? collegeStats : stats.collegeStats || [];
    const collegeLabels = cs.map((item: any) => item.institution);
    const paperCounts = cs.map((item: any) => item.count);
    const backgroundColors = [
        '#F5A051', '#3B82F6', '#10B981', '#F43F5E', '#8B5CF6',
        '#F97316', '#06B6D4', '#6366F1', '#EC4899', '#14B8A6'
    ];

    const pieData = {
        labels: collegeLabels.slice(0, 10),
        datasets: [{
            data: paperCounts.slice(0, 10),
            backgroundColor: backgroundColors,
            borderColor: '#ffffff',
            borderWidth: 2,
        }]
    };

    const barData = {
        labels: collegeLabels.slice(0, 8),
        datasets: [
            {
                label: 'Total Papers',
                data: cs.map((item: any) => item.count).slice(0, 8),
                backgroundColor: '#3B82F6',
                borderRadius: 8,
            },
            {
                label: 'Registered',
                data: cs.map((item: any) => item.regCnt).slice(0, 8),
                backgroundColor: '#10B981',
                borderRadius: 8,
            }
        ]
    };

    const statusData = {
        labels: stats.papersByStatus.map((s: any) => s._id),
        datasets: [{
            data: stats.papersByStatus.map((s: any) => s.count),
            backgroundColor: backgroundColors.slice().reverse(),
            borderColor: '#ffffff',
            borderWidth: 2,
        }]
    };

    const totalAmount = cs.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const totalReg = cs.reduce((sum: number, item: any) => sum + (item.regCnt || 0), 0);
    const totalNonReg = cs.reduce((sum: number, item: any) => sum + (item.nonRegCnt || 0), 0);
    const totalPapersTable = cs.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
    const totalPapersPaid = cs.reduce((sum: number, item: any) => sum + (item.papersPaid ?? 0), 0);
    const totalPapersPending = cs.reduce((sum: number, item: any) => sum + (item.papersPending ?? 0), 0);
    const totalPapersUnpaid = cs.reduce((sum: number, item: any) => sum + (item.papersUnpaid ?? 0), 0);

    const totalRevenue = summary?.conferenceTotals?.totalRevenue ?? totalAmount;
    const totalPapersKpi = stats.papers?.total ?? totalPapersTable;
    const pl = totalRevenue - FIXED_EXP;

    const categories = summary?.categories || [];

    const collegeBarMax = 34;
    const collegeBarRows = cs.slice(0, collegeBarMax);
    const shortInst = (s: string) =>
        !s ? '' : s.length > 26 ? `${s.slice(0, 24)}…` : s;
    const collegeBarLabels = collegeBarRows.map((item: any) => shortInst(item.institution));

    const collegeWiseBarData =
        collegeBarMode === 'count'
            ? {
                  labels: collegeBarLabels,
                  datasets: [
                      {
                          label: 'Paper count',
                          data: collegeBarRows.map((item: any) => item.count),
                          backgroundColor: '#2563EB',
                          borderRadius: 6
                      }
                  ]
              }
            : collegeBarMode === 'amount'
              ? {
                    labels: collegeBarLabels,
                    datasets: [
                        {
                            label: 'Verified reg. amount (₹)',
                            data: collegeBarRows.map((item: any) => Number(item.amount || 0)),
                            backgroundColor: '#059669',
                            borderRadius: 6
                        }
                    ]
                }
              : {
                    labels: collegeBarLabels,
                    datasets: [
                        {
                            label: 'Paid',
                            data: collegeBarRows.map((item: any) => Number(item.papersPaid ?? 0)),
                            backgroundColor: '#10B981',
                            stack: 's'
                        },
                        {
                            label: 'Pending',
                            data: collegeBarRows.map((item: any) => Number(item.papersPending ?? 0)),
                            backgroundColor: '#F59E0B',
                            stack: 's'
                        },
                        {
                            label: 'Not paid',
                            data: collegeBarRows.map((item: any) => Number(item.papersUnpaid ?? 0)),
                            backgroundColor: '#9CA3AF',
                            stack: 's'
                        }
                    ]
                };

    const collegeWiseBarOptions =
        collegeBarMode === 'paymentStatus'
            ? {
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { position: 'top' as const },
                      tooltip: { mode: 'index' as const, intersect: false }
                  },
                  scales: {
                      x: { stacked: true, ticks: { maxRotation: 45, minRotation: 0 } },
                      y: {
                          stacked: true,
                          beginAtZero: true,
                          ticks: { precision: 0 }
                      }
                  }
              }
            : {
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { display: collegeBarMode === 'amount' },
                      tooltip: { mode: 'index' as const }
                  },
                  scales: {
                      x: { ticks: { maxRotation: 50, minRotation: 0 } },
                      y: { beginAtZero: true }
                  }
              };

    return (
        <div className="space-y-6 sm:space-y-10 animate-fadeIn max-w-full min-w-0">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end">
                <div className="w-full min-w-0 sm:min-w-[160px] flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Domain / category</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
                    >
                        <option value="">All categories</option>
                        {categories.map((c: string) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full min-w-0 sm:min-w-[180px] flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institution contains</label>
                    <input
                        type="text"
                        value={institutionSearch}
                        onChange={(e) => setInstitutionSearch(e.target.value)}
                        placeholder="Filter by college name..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                </div>
                <button
                    type="button"
                    onClick={applyFilters}
                    className="w-full sm:w-auto px-5 py-2 bg-[#F5A051] text-white rounded-xl font-bold text-sm hover:bg-[#e59045]"
                >
                    Apply filters
                </button>
                <button
                    type="button"
                    onClick={downloadAcceptedExcel}
                    disabled={exportingExcel}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-sm border-2 border-green-700 text-green-800 bg-green-50 hover:bg-green-100 disabled:opacity-60"
                >
                    <Download className="w-4 h-4" />
                    {exportingExcel ? 'Preparing…' : 'Download Excel (accepted papers)'}
                </button>
            </div>
            <p className="text-[11px] text-gray-500 -mt-2">
                Excel includes one row per accepted paper: IDs, title, authors, university, payment, reviewers, editor, dates, copyright & camera-ready links, and PDF URL.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="p-4 bg-orange-100 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Papers</p>
                        <p className="text-2xl font-black text-gray-900">{totalPapersKpi}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="p-4 bg-green-100 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Registered pay.</p>
                        <p className="text-2xl font-black text-gray-900">{totalReg}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="p-4 bg-blue-100 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Growth</p>
                        <p className="text-2xl font-black text-gray-900">+{totalPapersKpi ? Math.round((totalReg / totalPapersKpi) * 100) : 0}%</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
                    <div className="p-4 bg-purple-100 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total revenue</p>
                        <p className="text-2xl font-black text-gray-900">₹{Number(totalRevenue).toLocaleString()}</p>
                        {summary?.conferenceTotals && (
                            <p className="text-[10px] text-gray-400 mt-1">
                                Reg ₹{Number(summary.conferenceTotals.registrationPaymentsVerified).toLocaleString()} ·
                                Final ₹{Number(summary.conferenceTotals.finalPaymentsVerified).toLocaleString()} ·
                                Listeners ₹{Number(summary.conferenceTotals.listenerPaymentsVerified).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                            College-wise bar chart
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            X: institution (top {collegeBarMax} by paper count in this view). Y: your selected metric.
                            {cs.length > collegeBarMax ? ` Showing first ${collegeBarMax} of ${cs.length}.` : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase self-center mr-1">Show</span>
                        {(
                            [
                                { id: 'count' as const, label: 'Paper count' },
                                { id: 'amount' as const, label: 'Payment (₹)' },
                                {
                                    id: 'paymentStatus' as const,
                                    label: 'Paid / Pending / Unpaid'
                                }
                            ] as const
                        ).map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCollegeBarMode(opt.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    collegeBarMode === opt.id
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-72 sm:h-80 md:h-96 w-full min-w-0">
                    <Bar data={collegeWiseBarData} options={collegeWiseBarOptions} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                        <div className="w-2 h-6 bg-[#F5A051] rounded-full"></div>
                        Submissions by Institution
                    </h3>
                    <div className="h-56 sm:h-72 md:h-80 flex justify-center">
                        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                        Registration Progress
                    </h3>
                    <div className="h-56 sm:h-72 md:h-80">
                        <Bar
                            data={barData}
                            options={{
                                maintainAspectRatio: false,
                                scales: {
                                    y: { beginAtZero: true, grid: { display: false } },
                                    x: { grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-gray-50/30">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">College / institution features</h3>
                        <p className="text-[11px] text-gray-500 mt-1">
                            Per-paper payment: <span className="text-green-700 font-bold">Paid</span> = verified amount;
                            <span className="text-amber-700 font-bold"> Pend.</span> = pending registration;{' '}
                            <span className="text-gray-600 font-bold">Unpaid</span> = no verified payment and no pending reg.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Filtered view</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1100px]">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase">College</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Papers</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Paid</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Pend.</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Unpaid</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Accepted</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Rejected</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">In review</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Authors</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Reg.</th>
                                <th className="px-3 py-3 text-xs font-black text-gray-400 uppercase text-center">Non-reg.</th>
                                <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase text-right">Reg. ₹</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cs.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-700 max-w-[200px]">{item.institution}</td>
                                    <td className="px-3 py-3 text-center font-bold">{item.count}</td>
                                    <td className="px-3 py-3 text-center text-green-700 font-bold">
                                        {item.papersPaid ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-center text-amber-700 font-bold">
                                        {item.papersPending ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-center text-gray-600 font-bold">
                                        {item.papersUnpaid ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-center text-green-700 font-bold">
                                        {item.accepted ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-center text-red-600 font-bold">
                                        {item.rejected ?? 0}
                                    </td>
                                    <td className="px-3 py-3 text-center text-amber-600">{item.inReview ?? 0}</td>
                                    <td className="px-3 py-3 text-center">{item.uniqueAuthors ?? '—'}</td>
                                    <td className="px-3 py-3 text-center">{item.regCnt}</td>
                                    <td className="px-3 py-3 text-center text-gray-500">{item.nonRegCnt}</td>
                                    <td className="px-4 py-3 text-right font-black">
                                        ₹{Number(item.amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-orange-50/30 font-black">
                                <td className="px-4 py-4">Total</td>
                                <td className="px-3 py-4 text-center">{totalPapersTable}</td>
                                <td className="px-3 py-4 text-center text-green-800">{totalPapersPaid}</td>
                                <td className="px-3 py-4 text-center text-amber-800">{totalPapersPending}</td>
                                <td className="px-3 py-4 text-center text-gray-700">{totalPapersUnpaid}</td>
                                <td className="px-3 py-4 text-center">
                                    {cs.reduce((s: number, i: any) => s + (i.accepted || 0), 0)}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {cs.reduce((s: number, i: any) => s + (i.rejected || 0), 0)}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {cs.reduce((s: number, i: any) => s + (i.inReview || 0), 0)}
                                </td>
                                <td className="px-3 py-4 text-center">—</td>
                                <td className="px-3 py-4 text-center">{totalReg}</td>
                                <td className="px-3 py-4 text-center">{totalNonReg}</td>
                                <td className="px-4 py-4 text-right text-orange-600">
                                    ₹{totalAmount.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-black text-gray-900">Papers & authors (detail)</h3>
                    {papersLoading && <span className="text-xs text-gray-400">Loading…</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px] text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-xs font-black text-gray-500 uppercase">Submission</th>
                                <th className="px-3 py-2 text-xs font-black text-gray-500 uppercase">Title / Author</th>
                                <th className="px-3 py-2 text-xs font-black text-gray-500 uppercase">Status</th>
                                <th className="px-3 py-2 text-xs font-black text-gray-500 uppercase">Editor</th>
                                <th className="px-3 py-2 text-xs font-black text-gray-500 uppercase">Reviewers</th>
                                <th className="px-3 py-2 text-xs font-black text-gray-500 uppercase text-right">Pay ₹</th>
                                <th className="px-3 py-2 text-xs font-black text-gray-500 uppercase">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {papers.map((p: any) => (
                                <tr key={p._id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-mono text-xs">{p.submissionId}</td>
                                    <td className="px-3 py-2">
                                        <div className="font-bold text-gray-800 line-clamp-1">{p.paperTitle}</div>
                                        <div className="text-xs text-gray-500">{p.authorName} · {p.email}</div>
                                        <div className="text-[10px] text-gray-400">{p.institution || '—'} · {p.category}</div>
                                    </td>
                                    <td className="px-3 py-2"><span className="text-xs font-bold">{p.status}</span></td>
                                    <td className="px-3 py-2 text-xs">{p.editor ? `${p.editor.username}` : '—'}</td>
                                    <td className="px-3 py-2 text-xs max-w-[200px]">
                                        {(p.reviewers || []).map((r: any) => r.username).join(', ') || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono">{p.paymentTotal?.toLocaleString() ?? 0}</td>
                                    <td className="px-3 py-2 text-xs text-gray-600">
                                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 flex justify-center gap-4 items-center border-t border-gray-100">
                    <button
                        type="button"
                        disabled={papersPage <= 1}
                        onClick={() => setPapersPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 text-sm font-bold"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">Page {papersMeta.page} / {papersMeta.pages} ({papersMeta.total} papers)</span>
                    <button
                        type="button"
                        disabled={papersPage >= papersMeta.pages}
                        onClick={() => setPapersPage((p) => p + 1)}
                        className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-40 text-sm font-bold"
                    >
                        Next
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                {FIXED_EXP > 0 && (
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-xl text-white">
                        <div className="flex justify-between items-start mb-6">
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Conference expenditure (VITE_CONFERENCE_FIXED_EXPENSE)</p>
                            <AlertCircle className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-sm font-medium text-gray-300">Fixed expense</h4>
                                <p className="text-3xl font-black mt-2">₹{FIXED_EXP.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-bold ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {pl >= 0 ? 'Surplus' : 'Deficit'}
                                </p>
                                <p className="text-xl font-black mt-1">₹{Math.abs(pl).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 ${FIXED_EXP > 0 ? '' : 'md:col-span-2'}`}>
                    <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                        <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                        Submissions Status
                    </h3>
                    <div className="h-52 sm:h-64 md:h-80 flex justify-center">
                        <Doughnut
                            data={statusData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardStats;
