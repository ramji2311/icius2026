import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileText, Upload, Search, UserPlus, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import React from 'react';
import api from '../config/api';
import Swal from 'sweetalert2';
import AdminSidebar from './AdminSidebar';



// Paper categories
const paperCategories = [
    { id: 'AI_ML', name: 'Artificial Intelligence and Machine Learning', description: 'Neural networks, deep learning, NLP, computer vision, robotics' },
    { id: 'DATA_SCIENCE', name: 'Data Science and Big Data Analytics', description: 'Data mining, predictive analytics, data visualization, statistical modeling' },
    { id: 'CYBER_SECURITY', name: 'Cyber Security and Privacy', description: 'Network security, cryptography, blockchain, threat detection' },
    { id: 'CLOUD_COMPUTING', name: 'Cloud Computing and Distributed Systems', description: 'Cloud architecture, edge computing, virtualization, IoT' },
    { id: 'SOFTWARE_ENG', name: 'Software Engineering and DevOps', description: 'Agile methodologies, CI/CD, microservices, software architecture' },
    { id: 'NETWORKS', name: 'Computer Networks and Communications', description: '5G/6G, wireless networks, network protocols, SDN' },
    { id: 'HCI', name: 'Human-Computer Interaction', description: 'UX/UI design, accessibility, virtual/augmented reality' },
    { id: 'BIOINFO', name: 'Bioinformatics and Computational Biology', description: 'Genomic analysis, protein modeling, systems biology' },
    { id: 'QUANTUM', name: 'Quantum Computing', description: 'Quantum algorithms, quantum cryptography, quantum machine learning' },
    { id: 'GREEN_COMPUTING', name: 'Green Computing and Sustainability', description: 'Energy-efficient computing, sustainable IT practices' }
];

interface Author {
    _id: string;
    email: string;
    username: string;
    country?: string;
}

const AdminPaperSubmission = React.memo(() => {
    // Form states
    const [authorEmail, setAuthorEmail] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [authorPassword, setAuthorPassword] = useState('');
    const [paperTitle, setPaperTitle] = useState('');
    const [category, setCategory] = useState('');
    const [topic, setTopic] = useState('');
    const [abstract, setAbstract] = useState('');
    const [institution, setInstitution] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [createAccountIfNotExists, setCreateAccountIfNotExists] = useState(true);
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [searchingAuthors, setSearchingAuthors] = useState(false);
    const [existingAuthors, setExistingAuthors] = useState<Author[]>([]);
    const [showAuthorSearch, setShowAuthorSearch] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
    const [fileName, setFileName] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Search for existing authors
    const searchAuthors = async (query: string) => {
        if (query.length < 2) {
            setExistingAuthors([]);
            return;
        }
        
        setSearchingAuthors(true);
        try {
            const response = await api.get('/api/admin-paper-submission/search-authors', {
                params: { query }
            });
            
            if (response.data.success) {
                setExistingAuthors(response.data.authors);
            }
        } catch (error) {
            console.error('Error searching authors:', error);
        } finally {
            setSearchingAuthors(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (authorEmail.length >= 2 && showAuthorSearch) {
                searchAuthors(authorEmail);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [authorEmail, showAuthorSearch]);

    const handleAuthorSelect = (author: Author) => {
        setSelectedAuthor(author);
        setAuthorEmail(author.email);
        setAuthorName(author.username);
        setShowAuthorSearch(false);
        setExistingAuthors([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                Swal.fire({
                    icon: 'info',
                    title: 'Invalid File',
                    text: 'Please upload a PDF file only.',
                    confirmButtonColor: '#dc2626'
                });
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire({
                    icon: 'info',
                    title: 'File Too Large',
                    text: 'File size must be less than 10MB.',
                    confirmButtonColor: '#dc2626'
                });
                return;
            }
            setPdfFile(file);
            setFileName(file.name);
        }
    };

    const clearAuthorSelection = () => {
        setSelectedAuthor(null);
        setAuthorEmail('');
        setAuthorName('');
        setAuthorPassword('');
        setAbstract('');
        setInstitution('');
        setExistingAuthors([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!authorEmail || !authorName || !paperTitle || !category) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please fill in all required fields (Author Email, Author Name, Paper Title, Category).',
                confirmButtonColor: '#F5A051'
            });
            return;
        }

        if (!pdfFile) {
            Swal.fire({
                icon: 'warning',
                title: 'No PDF File',
                text: 'Please upload a PDF file.',
                confirmButtonColor: '#F5A051'
            });
            return;
        }

        if (!selectedAuthor && createAccountIfNotExists && !authorPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Password Required',
                text: 'Please enter a password for the new author account (minimum 6 characters).',
                confirmButtonColor: '#F5A051'
            });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('authorEmail', authorEmail);
            formData.append('authorName', authorName);
            if (authorPassword) formData.append('authorPassword', authorPassword);
            formData.append('paperTitle', paperTitle);
            formData.append('category', category);
            if (topic) formData.append('topic', topic);
            if (abstract) formData.append('abstract', abstract);
            formData.append('institution', institution);
            formData.append('createAccountIfNotExists', createAccountIfNotExists.toString());
            formData.append('pdf', pdfFile);

            const response = await api.post(
                '/api/admin-paper-submission/submit-for-author',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Paper Submitted!',
                    html: `
                        <div style="text-align: left;">
                            <p><strong>${response.data.message}</strong></p>
                            <p style="margin-top: 10px;">Submission ID: <strong>${response.data.submission.submissionId}</strong></p>
                            <p>Paper Title: ${response.data.submission.paperTitle}</p>
                            <p>Author: ${response.data.submission.authorName} (${response.data.submission.email})</p>
                        </div>
                    `,
                    confirmButtonColor: '#10b981',
                    confirmButtonText: 'Great!'
                });

                // Reset form
                clearAuthorSelection();
                setPaperTitle('');
                setCategory('');
                setTopic('');
                setAbstract('');
                setInstitution('');
                setPdfFile(null);
                setFileName('');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            
            if (error.response?.data?.userNotFound) {
                Swal.fire({
                    icon: 'info',
                    title: 'Author Account Not Found',
                    text: 'The email address is not registered. Please check "Create new account if not exists" and provide a password.',
                    confirmButtonColor: '#F5A051'
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Submission Failed',
                    text: error.response?.data?.message || 'An error occurred while submitting the paper.',
                    confirmButtonColor: '#dc2626'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 min-w-0">
            <AdminSidebar activeTab="submitAuthor" />
            <main className="flex-1 min-w-0 overflow-y-auto min-h-0 lg:h-screen pt-16 lg:pt-0 px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-[#F5A051]" />
                            Admin Paper Submission
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Submit papers on behalf of authors who need assistance. You can create new author accounts or select existing ones.
                        </p>
                    </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Author Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-[#F5A051]" />
                            Author Information
                        </h2>

                        {/* Selected Author Display */}
                        {selectedAuthor && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-800">Selected Existing Author</p>
                                            <p className="text-sm text-green-600">{selectedAuthor.username} ({selectedAuthor.email})</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearAuthorSelection}
                                        className="text-green-700 hover:text-green-900 text-sm underline"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Author Email */}
                        <div className="mb-4 relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Author Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={authorEmail}
                                    onChange={(e) => {
                                        setAuthorEmail(e.target.value);
                                        if (!selectedAuthor) {
                                            setShowAuthorSearch(true);
                                        }
                                    }}
                                    onFocus={() => setShowAuthorSearch(true)}
                                    disabled={!!selectedAuthor}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent disabled:bg-gray-100"
                                    placeholder="Enter author email address..."
                                    required
                                />
                                {!selectedAuthor && (
                                    <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                                )}
                            </div>

                            {/* Author Search Results */}
                            {showAuthorSearch && !selectedAuthor && authorEmail.length >= 2 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {searchingAuthors ? (
                                        <div className="p-4 text-center text-gray-500">
                                            <Loader className="w-5 h-5 animate-spin mx-auto mb-2" />
                                            Searching...
                                        </div>
                                    ) : existingAuthors.length > 0 ? (
                                        <>
                                            <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b">
                                                Select existing author or continue with new account
                                            </div>
                                            {existingAuthors.map((author) => (
                                                <button
                                                    key={author._id}
                                                    type="button"
                                                    onClick={() => handleAuthorSelect(author)}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                                >
                                                    <p className="font-medium text-gray-800">{author.username}</p>
                                                    <p className="text-sm text-gray-500">{author.email}</p>
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">
                                            No existing authors found. You can create a new account.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Author Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Author Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                disabled={!!selectedAuthor}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent disabled:bg-gray-100"
                                placeholder="Enter author full name..."
                                required
                            />
                        </div>

                        {/* Create Account Option */}
                        {!selectedAuthor && (
                            <>
                                <div className="mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={createAccountIfNotExists}
                                            onChange={(e) => setCreateAccountIfNotExists(e.target.checked)}
                                            className="w-4 h-4 text-[#F5A051] rounded focus:ring-[#F5A051]"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Create new author account if email doesn't exist
                                        </span>
                                    </label>
                                </div>

                                {createAccountIfNotExists && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password for New Account <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={authorPassword}
                                            onChange={(e) => setAuthorPassword(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                                            placeholder="Minimum 6 characters..."
                                            minLength={6}
                                            required={createAccountIfNotExists && !selectedAuthor}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            This password will be used for the new author account.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Paper Details Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#F5A051]" />
                            Paper Details
                        </h2>

                        {/* Paper Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Paper Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={paperTitle}
                                onChange={(e) => setPaperTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                                placeholder="Enter paper title..."
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                                required
                            >
                                <option value="">Select a category...</option>
                                {paperCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {category && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {paperCategories.find(c => c.id === category)?.description}
                                </p>
                            )}
                        </div>

                        {/* Topic */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Topic/Subcategory
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                                placeholder="Specific topic or subcategory..."
                            />
                        </div>

                        {/* Abstract */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Abstract
                            </label>
                            <textarea
                                value={abstract}
                                onChange={(e) => setAbstract(e.target.value)}
                                rows={5}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                                placeholder="Enter paper abstract (optional)..."
                            />
                        </div>

                        {/* Institution */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                College / Institution <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={institution}
                                onChange={(e) => setInstitution(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A051] focus:border-transparent"
                                placeholder="Enter college or institution name..."
                                required
                            />
                        </div>
                    </div>

                    {/* PDF Upload Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-[#F5A051]" />
                            PDF Upload
                        </h2>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#F5A051] transition-colors">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label
                                htmlFor="pdf-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                <p className="text-lg font-medium text-gray-700 mb-2">
                                    Click to upload PDF file
                                </p>
                                <p className="text-sm text-gray-500">
                                    Maximum file size: 10MB
                                </p>
                                {fileName && (
                                    <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">{fileName}</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#F5A051] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#e59045] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Submit Paper for Author
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info Alert */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                            <p className="font-medium mb-1">Important Notes:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>The author will receive a confirmation email with submission details.</li>
                                <li>If creating a new account, the author can log in with the email and password provided.</li>
                                <li>All submissions are tracked and visible in the author's dashboard.</li>
                            </ul>
                        </div>
                    </div>
                </form>
                </div>
            </main>
        </div>
    );
});

export default AdminPaperSubmission;
