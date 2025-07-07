import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import type { NominatimResult } from '../types';

interface SearchLocationProps {
  onLocationSelect: (lat: number, lng: number, displayName: string) => void;
}

export const SearchLocation = ({ onLocationSelect }: SearchLocationProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timeoutRef = useRef<number | undefined>(undefined);

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query);
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "ioslocachange (ioslocahange@gmail.com)" },
      });

      if (!res.ok) throw new Error("Search failed");

      const data: NominatimResult[] = await res.json();
      setResults(data);
      setShowResults(true);
    } catch {
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      searchLocation(search);
    }, 400);

    return () => clearTimeout(timeoutRef.current);
  }, [search]);

  const selectSuggestion = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    onLocationSelect(lat, lon, result.display_name);
    setSearch(result.display_name);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex-1 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Search className="h-5 w-5 mr-2 text-blue-600" />
        Search Location
      </h2>

      <div className="flex-1 flex flex-col">
        <div className="relative mb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(-1);
            }}
            placeholder="Search for a location..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onFocus={() => search.length >= 3 && setShowResults(true)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setShowResults(false);
                setSelectedIndex(-1);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg flex-1 overflow-y-auto">
            {results.map((res, idx) => (
              <div
                key={res.place_id}
                onClick={() => selectSuggestion(res)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-4 py-3 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                  idx === selectedIndex ? "bg-blue-50" : "bg-white"
                }`}
              >
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{res.display_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  };