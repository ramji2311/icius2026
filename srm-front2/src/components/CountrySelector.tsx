import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import api from '../config/api';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { ALL_COUNTRIES } from '../utils/countries';



interface CountrySelectorProps {
    onCountryChange?: (country: string) => void;
    showAsModal?: boolean;
}

// Convert countries to react-select format
const countryOptions = ALL_COUNTRIES.map(country => ({
    value: country.value,
    label: country.label
}));

const CountrySelector: React.FC<CountrySelectorProps> = ({ onCountryChange, showAsModal = false }) => {
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);

    useEffect(() => {
        // Check if user has already selected a country
        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry) {
            setSelectedCountry(storedCountry);
        } else {
            // Show selector if no country is set
            setShowSelector(true);
        }
    }, []);

    const handleCountrySelect = async (country: string) => {
        try {
            setLoading(true);

            // Update in backend if logged in
            const response = await api.put(
                '/api/auth/update-country',
                { country }
            );

            if (response.data.success) {
                localStorage.setItem('userCountry', country);
                setSelectedCountry(country);
                setShowSelector(false);

                if (onCountryChange) onCountryChange(country);

                Swal.fire({
                    icon: 'success',
                    title: 'Country Updated!',
                    text: `Your country has been set to ${country}. Registration fees will be displayed accordingly.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error: any) {
            // If auth error, just store locally
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.setItem('userCountry', country);
                setSelectedCountry(country);
                setShowSelector(false);
                if (onCountryChange) onCountryChange(country);
                return;
            }
            console.error('Error updating country:', error);
            Swal.fire({
                icon: 'info',
                title: 'Update Failed',
                text: error.response?.data?.message || 'Failed to update country',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!showSelector && selectedCountry && !showAsModal) {
        // Show compact selected country display
        const countryLabel = ALL_COUNTRIES.find(c => c.value === selectedCountry)?.label || selectedCountry;
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                    <Globe className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                        Your Country: <span className="font-bold text-blue-600">{countryLabel}</span>
                    </span>
                </div>
                <button
                    onClick={() => setShowSelector(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                    Change
                </button>
            </div>
        );
    }

    // Custom styles for react-select
    const customStyles = {
        control: (base: any, state: any) => ({
            ...base,
            padding: '4px',
            borderRadius: '12px',
            borderWidth: '2px',
            borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
            '&:hover': {
                borderColor: '#3b82f6'
            }
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
            color: state.isSelected ? 'white' : '#1f2937',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: '#3b82f6'
            }
        }),
        menu: (base: any) => ({
            ...base,
            borderRadius: '12px',
            marginTop: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        })
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-800">Select Your Country</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
                Please select your country to view appropriate registration fees. You can type to search.
            </p>

            <Select
                options={countryOptions}
                value={countryOptions.find(option => option.value === selectedCountry)}
                onChange={(option) => option && handleCountrySelect(option.value)}
                isDisabled={loading}
                isSearchable={true}
                placeholder="🔍 Type to search for your country..."
                styles={customStyles}
                className="text-base"
            />

            {selectedCountry && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 text-center flex items-center justify-center">
                        <Check className="h-4 w-4 mr-2" />
                        Country selected: <span className="font-bold ml-1">{ALL_COUNTRIES.find(c => c.value === selectedCountry)?.label}</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default CountrySelector;
