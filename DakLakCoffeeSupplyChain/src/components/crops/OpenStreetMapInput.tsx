'use client';

import { useState, useEffect, useRef } from 'react';

interface OpenStreetMapInputProps {
    value: string;
    onChange: (address: string) => void;
    placeholder?: string;
    className?: string;
}

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        village?: string;
        town?: string;
        city?: string;
        state?: string;
        country?: string;
        hamlet?: string;
        suburb?: string;
        county?: string;
        region?: string;
    };
}

// Function để chuyển đổi địa chỉ tiếng Anh sang tiếng Việt (tập trung Đắk Lắk)
const translateAddressToVietnamese = (displayName: string): string => {
    const translations: { [key: string]: string } = {
        // Tỉnh/Thành phố
        'Dak Lak Province': 'Tỉnh Đắk Lắk',
        'Dak Lak': 'Đắk Lắk',
        'Dak Lak, Vietnam': 'Đắk Lắk, Việt Nam',

        // Thành phố Buôn Ma Thuột
        'Buon Ma Thuot': 'Buôn Ma Thuột',
        'Buon Ma Thuot City': 'Thành phố Buôn Ma Thuột',
        'Buon Ma Thuot Ward': 'Phường Buôn Ma Thuột',

        // Các huyện Đắk Lắk
        'Ea H\'leo': 'Ea H\'leo',
        'Ea H\'leo District': 'Huyện Ea H\'leo',
        'Ea Kar': 'Ea Kar',
        'Ea Kar District': 'Huyện Ea Kar',
        'Ea Súp': 'Ea Súp',
        'Ea Súp District': 'Huyện Ea Súp',
        'Ea Drang': 'Ea Drăng',
        'Ea Drang District': 'Huyện Ea Drăng',
        'Ea Hiao': 'Ea Hiao',
        'Ea Hiao District': 'Huyện Ea Hiao',
        'Ea Wy': 'Ea Wy',
        'Ea Wy District': 'Huyện Ea Wy',
        'Ea Khăl': 'Ea Khăl',
        'Ea Khăl District': 'Huyện Ea Khăl',
        'Ea Rốk': 'Ea Rốk',
        'Ea Rốk District': 'Huyện Ea Rốk',
        'Ea Bung': 'Ea Bung',
        'Ea Bung District': 'Huyện Ea Bung',
        'Ea Wer': 'Ea Wer',
        'Ea Wer District': 'Huyện Ea Wer',
        'Ea Nuôl': 'Ea Nuôl',
        'Ea Nuôl District': 'Huyện Ea Nuôl',
        'Ea Kiết': 'Ea Kiết',
        'Ea Kiết District': 'Huyện Ea Kiết',
        'Ea Tul': 'Ea Tul',
        'Ea Tul District': 'Huyện Ea Tul',
        'Ea M\'Droh': 'Ea M\'Droh',
        'Ea M\'Droh District': 'Huyện Ea M\'Droh',
        'Ea Drông': 'Ea Drông',
        'Ea Drông District': 'Huyện Ea Drông',
        'Ea Knốp': 'Ea Knốp',
        'Ea Knốp District': 'Huyện Ea Knốp',
        'Ea Păl': 'Ea Păl',
        'Ea Păl District': 'Huyện Ea Păl',
        'Ea Ô': 'Ea Ô',
        'Ea Ô District': 'Huyện Ea Ô',
        'Ea Riêng': 'Ea Riêng',
        'Ea Riêng District': 'Huyện Ea Riêng',
        'Ea Trang': 'Ea Trang',
        'Ea Trang District': 'Huyện Ea Trang',
        'Ea Kly': 'Ea Kly',
        'Ea Kly District': 'Huyện Ea Kly',
        'Ea Phê': 'Ea Phê',
        'Ea Phê District': 'Huyện Ea Phê',
        'Ea Knuếc': 'Ea Knuếc',
        'Ea Knuếc District': 'Huyện Ea Knuếc',
        'Ea Ning': 'Ea Ning',
        'Ea Ning District': 'Huyện Ea Ning',
        'Ea Ktur': 'Ea Ktur',
        'Ea Ktur District': 'Huyện Ea Ktur',
        'Ea Na': 'Ea Na',
        'Ea Na District': 'Huyện Ea Na',

        // Krông
        'Krông Năng': 'Krông Năng',
        'Krông Năng District': 'Huyện Krông Năng',
        'Krông Pắc': 'Krông Pắc',
        'Krông Pắc District': 'Huyện Krông Pắc',
        'Krông Búk': 'Krông Búk',
        'Krông Búk District': 'Huyện Krông Búk',
        'Krông Ana': 'Krông Ana',
        'Krông Ana District': 'Huyện Krông Ana',
        'Krông Bông': 'Krông Bông',
        'Krông Bông District': 'Huyện Krông Bông',
        'Krông Nô': 'Krông Nô',
        'Krông Nô District': 'Huyện Krông Nô',
        'Krông Á': 'Krông Á',
        'Krông Á District': 'Huyện Krông Á',

        // Cư
        'Cư M\'gar': 'Cư M\'gar',
        'Cư M\'gar District': 'Huyện Cư M\'gar',
        'Cư Jút': 'Cư Jút',
        'Cư Jút District': 'Huyện Cư Jút',
        'Cư Yang': 'Cư Yang',
        'Cư Yang District': 'Huyện Cư Yang',
        'Cư Prao': 'Cư Prao',
        'Cư Prao District': 'Huyện Cư Prao',
        'Cư M\'ta': 'Cư M\'ta',
        'Cư M\'ta District': 'Huyện Cư M\'ta',
        'Cư Pui': 'Cư Pui',
        'Cư Pui District': 'Huyện Cư Pui',
        'Cư Pơng': 'Cư Pơng',
        'Cư Pơng District': 'Huyện Cư Pơng',
        'Cư Bao': 'Cư Bao',
        'Cư Bao District': 'Huyện Cư Bao',

        // Đắk
        'Đắk Mil': 'Đắk Mil',
        'Đắk Mil District': 'Huyện Đắk Mil',
        'Đắk R\'lấp': 'Đắk R\'lấp',
        'Đắk R\'lấp District': 'Huyện Đắk R\'lấp',
        'Đắk Song': 'Đắk Song',
        'Đắk Song District': 'Huyện Đắk Song',
        'Đắk Glong': 'Đắk Glong',
        'Đắk Glong District': 'Huyện Đắk Glong',
        'Đắk Liêng': 'Đắk Liêng',
        'Đắk Liêng District': 'Huyện Đắk Liêng',
        'Đắk Phơi': 'Đắk Phơi',
        'Đắk Phơi District': 'Huyện Đắk Phơi',

        // Khác
        'Lắk': 'Lắk',
        'Lắk District': 'Huyện Lắk',
        'M\'Drắk': 'M\'Drắk',
        'M\'Drắk District': 'Huyện M\'Drắk',
        'Tuy Đức': 'Tuy Đức',
        'Tuy Đức District': 'Huyện Tuy Đức',
        'Buôn Đôn': 'Buôn Đôn',
        'Buôn Đôn District': 'Huyện Buôn Đôn',
        'Dang Kang': 'Dang Kang',
        'Dang Kang District': 'Huyện Dang Kang',
        'Yang Mao': 'Yang Mao',
        'Yang Mao District': 'Huyện Yang Mao',
        'Hòa Sơn': 'Hòa Sơn',
        'Hòa Sơn District': 'Huyện Hòa Sơn',
        'Liên Sơn Lắk': 'Liên Sơn Lắk',
        'Liên Sơn Lắk District': 'Huyện Liên Sơn Lắk',
        'Nam Ka': 'Nam Ka',
        'Nam Ka District': 'Huyện Nam Ka',
        'Dray Bhăng': 'Dray Bhăng',
        'Dray Bhăng District': 'Huyện Dray Bhăng',
        'Dur Kmăl': 'Dur Kmăl',
        'Dur Kmăl District': 'Huyện Dur Kmăl',

        // Xã/Phường/Thôn
        'Ward': 'Phường',
        'Commune': 'Xã',
        'Village': 'Thôn',
        'Hamlet': 'Ấp',
        'Suburb': 'Phường',

        // Từ khóa chung
        'Vietnam': 'Việt Nam',
        'Province': 'Tỉnh',
        'District': 'Huyện',
        'City': 'Thành phố',
        'Town': 'Thị xã',
    };

    let translatedName = displayName;

    // Thay thế từng từ
    Object.entries(translations).forEach(([english, vietnamese]) => {
        const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        translatedName = translatedName.replace(regex, vietnamese);
    });

    return translatedName;
};

export const OpenStreetMapInput: React.FC<OpenStreetMapInputProps> = ({
    value,
    onChange,
    placeholder = "Nhập địa chỉ...",
    className = ""
}) => {
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Tìm kiếm chỉ trong khu vực Đắk Lắk
            const searchQuery = `${query}, Đắk Lắk, Vietnam`;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&countrycodes=vn&limit=10&addressdetails=1&accept-language=vi,en&bounded=1&viewbox=107.5,12.0,109.0,13.5`
            );

            if (!response.ok) {
                throw new Error('Không thể tìm kiếm địa chỉ');
            }

            const data: NominatimResult[] = await response.json();

            // Lọc chỉ các kết quả thực sự thuộc Đắk Lắk
            const dakLakResults = data.filter(result => {
                const displayName = result.display_name.toLowerCase();
                const address = result.address;

                // Kiểm tra tên hiển thị có chứa địa danh Đắk Lắk
                const hasDakLakLocation = displayName.includes('đắk lắk') ||
                    displayName.includes('dak lak') ||
                    displayName.includes('buôn ma thuột') ||
                    displayName.includes('buon ma thuot') ||
                    displayName.includes('ea ') ||
                    displayName.includes('krông') ||
                    displayName.includes('krong') ||
                    displayName.includes('cư ') ||
                    displayName.includes('cu ') ||
                    displayName.includes('lắk') ||
                    displayName.includes('lak') ||
                    displayName.includes('m\'drắk') ||
                    displayName.includes('mdrak');

                // Kiểm tra address có chứa Đắk Lắk
                const hasDakLakInAddress = address && (
                    address.state?.toLowerCase().includes('đắk lắk') ||
                    address.state?.toLowerCase().includes('dak lak') ||
                    address.region?.toLowerCase().includes('đắk lắk') ||
                    address.region?.toLowerCase().includes('dak lak')
                );

                return hasDakLakLocation || hasDakLakInAddress;
            });

            setSuggestions(dakLakResults);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error searching address:', error);
            setError('Không thể tìm kiếm địa chỉ');
            setSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        onChange(inputValue);

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce search
        timeoutRef.current = setTimeout(() => {
            searchAddress(inputValue);
        }, 500);
    };

    const handleSuggestionClick = (result: NominatimResult) => {
        const vietnameseAddress = translateAddressToVietnamese(result.display_name);
        onChange(vietnameseAddress);
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

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

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

            {error && (
                <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {error}
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    {suggestions.map((result, index) => (
                        <div
                            key={index}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSuggestionClick(result)}
                        >
                            <div className="font-medium text-gray-900">
                                {translateAddressToVietnamese(result.display_name)}
                            </div>
                            <div className="text-sm text-gray-500">
                                {result.display_name}
                            </div>
                            {result.address && (
                                <div className="text-xs text-gray-400 mt-1">
                                    Tọa độ: {result.lat}, {result.lon}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
