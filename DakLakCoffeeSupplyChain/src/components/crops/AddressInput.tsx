'use client';

import { useState, useEffect, useRef } from 'react';

interface AddressInputProps {
    value: string;
    onChange: (address: string) => void;
    placeholder?: string;
    className?: string;
}

interface WardData {
    name: string;
    code: number;
    division_type: string;
    codename: string;
    address: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
    value,
    onChange,
    placeholder = "Nhập địa chỉ...",
    className = ""
}) => {
    const [suggestions, setSuggestions] = useState<WardData[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dakLakWards, setDakLakWards] = useState<WardData[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadDakLakWards = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/provinces/daklak-wards');
                const data = await response.json();
                setDakLakWards(data);
            } catch (error) {
                console.error('Error loading wards:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDakLakWards();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        onChange(inputValue);

        if (inputValue.length > 2) {
            const filtered = dakLakWards.filter(ward =>
                ward.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 10));
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (ward: WardData) => {
        onChange(ward.address);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleBlur = () => {
        // Delay để cho phép click vào suggestion
        setTimeout(() => setShowSuggestions(false), 200);
    };

    return (
        <div className={`relative ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {loading && (
                <div className="absolute right-2 top-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {suggestions.map((ward) => (
                        <div
                            key={ward.code}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSuggestionClick(ward)}
                        >
                            <div className="font-medium text-gray-900">{ward.name}</div>
                            <div className="text-sm text-gray-500">{ward.division_type}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
