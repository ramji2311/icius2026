import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface FeeTableProps {
    userCountry?: string;
    membershipStatus?: any;
    isAccepted?: boolean;
}

const EnhancedFeeTable: React.FC<FeeTableProps> = ({ userCountry, membershipStatus, isAccepted }) => {
    const [country, setCountry] = useState<string>(userCountry || '');

    useEffect(() => {
        if (!country) {
            const storedCountry = localStorage.getItem('userCountry');
            if (storedCountry) {
                setCountry(storedCountry);
            }
        }
    }, [country]);

    const isMember = membershipStatus?.isMember || false;

    // Determine which rows to highlight based on user's country
    const getRowClassName = (rowCountry: string) => {
        if (country === rowCountry) {
            const gradients = {
                'India': 'bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 border-l-4 border-blue-500 shadow-md',
                'Indonesia': 'bg-gradient-to-r from-green-100 via-green-50 to-green-100 border-l-4 border-green-500 shadow-md',
                'Other': 'bg-gradient-to-r from-purple-100 via-purple-50 to-purple-100 border-l-4 border-purple-500 shadow-md'
            };
            return gradients[rowCountry as keyof typeof gradients] || '';
        }
        return 'hover:bg-gray-50 transition-colors';
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Country indicator */}
            {country && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3">
                    <p className="text-sm font-semibold">
                        📍 Showing fees for: <span className="text-yellow-300">{country}</span>
                        {isAccepted && <span className="ml-3 bg-blue-500 px-2 py-1 rounded text-xs">✓ Author Status Verified</span>}
                    </p>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                        <tr>
                            <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm font-bold uppercase tracking-wider">
                                Category
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm font-bold uppercase tracking-wider">
                                Type
                            </th>
                            <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm font-bold uppercase tracking-wider">
                                Registration Fee
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Indian Participant Section */}
                        <tr className={getRowClassName('India')}>
                            <td rowSpan={isAccepted ? 1 : 2} className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base font-bold text-gray-800 bg-gray-100">
                                🇮🇳 Indian Participant
                                {country === 'India' && (
                                    <div className="text-xs font-normal text-blue-600 mt-1">← Your Category</div>
                                )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base font-medium text-gray-800">
                                Authors
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                                <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">₹24,000 (300 USD)</span>
                            </td>
                        </tr>

                        {!isAccepted && (
                            <tr className={getRowClassName('India')}>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base font-medium text-gray-800">
                                    Listeners
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">₹12,000 (150 USD)</span>
                                </td>
                            </tr>
                        )}

                        {/* Foreign Participant Section */}
                        <tr className={getRowClassName('Other')}>
                            <td rowSpan={isAccepted ? 1 : 2} className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base font-bold text-gray-800 bg-gray-100">
                                🌍 Foreign Participant
                                {country === 'Other' && (
                                    <div className="text-xs font-normal text-purple-600 mt-1">← Your Category</div>
                                )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base font-medium text-gray-800">
                                Authors
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                                <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">$400</span>
                            </td>
                        </tr>

                        {!isAccepted && (
                            <tr className={getRowClassName('Other')}>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base font-medium text-gray-800">
                                    Listeners
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">$200</span>
                                </td>
                            </tr>
                        )}


                    </tbody>
                </table>
            </div>

            {/* Fee Includes Section */}
            <div className="bg-gray-50 p-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Conference fee includes:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
                    <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        Conference kit
                    </li>
                    <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        Certificate
                    </li>
                    <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        Proceedings
                    </li>
                </ul>
                <p className="mt-4 text-sm text-gray-600 italic">
                    * These fees do not include accommodation or Scopus/WOS publication fees.
                </p>
            </div>

            {/* Note about Scopus */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start">
                    <AlertCircle className="text-yellow-400 mt-1 mr-3" size={20} />
                    <p className="text-sm text-yellow-700">
                        <span className="font-medium">Note:</span> Authors interested in publishing their articles in Scopus/WOS indexed journals will be charged additional fees based on the journal.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnhancedFeeTable;
