import React from 'react';
import { UserPlus, RefreshCw } from 'lucide-react';

interface CreateReviewerFormProps {
    newReviewer: any;
    setNewReviewer: (data: any) => void;
    onSubmit: () => void;
    isLoading: boolean;
    onGeneratePassword: () => void;
}

export const CreateReviewerForm: React.FC<CreateReviewerFormProps> = React.memo(({
    newReviewer,
    setNewReviewer,
    onSubmit,
    isLoading,
    onGeneratePassword
}) => {
    return (
        <div className="bg-white rounded-lg p-6 max-w-2xl">
            <div className="mb-6 p-4 bg-orange-50 border-l-4 border-[#F5A051] rounded">
                <h3 className="font-semibold text-orange-900 mb-2">📧 Add New Reviewer Account</h3>
                <p className="text-orange-800 text-sm">
                    Create a new reviewer account with email, username, and password. Credentials will be used for sending review assignment emails.
                </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gmail Address *
                    </label>
                    <input
                        type="email"
                        value={newReviewer.email}
                        onChange={(e) => setNewReviewer({ ...newReviewer, email: e.target.value })}
                        placeholder="reviewer@example.com"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                    </label>
                    <input
                        type="text"
                        value={newReviewer.username}
                        onChange={(e) => setNewReviewer({ ...newReviewer, username: e.target.value })}
                        placeholder="john_doe"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newReviewer.password}
                            onChange={(e) => setNewReviewer({ ...newReviewer, password: e.target.value })}
                            placeholder="Min 6 characters"
                            required
                            minLength={6}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5A051]"
                        />
                        <button
                            type="button"
                            onClick={onGeneratePassword}
                            className="p-2 bg-orange-100 text-[#F5A051] rounded-lg hover:bg-orange-200 transition"
                            title="Generate random password"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password will be used in email credentials</p>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-[#F5A051] text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Create Reviewer Account
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
});
