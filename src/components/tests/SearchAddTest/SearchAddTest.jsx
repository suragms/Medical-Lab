import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { getTestsMaster } from '../../../features/shared/dataService';
import './SearchAddTest.css';

const SearchAddTest = ({ onAddTest, onAddManual }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Search with debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsLoading(true);

    // Debounce 250ms
    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await getTestsMaster(searchTerm);
        setResults(searchResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectTest = (test) => {
    onAddTest(test);
    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
  };

  const handleAddManual = () => {
    if (onAddManual) {
      onAddManual();
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="search-add-test-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search test to add…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setIsOpen(true)}
        />
        {isLoading && <span className="loading-spinner">⏳</span>}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="search-results-dropdown">
          {results.length > 0 ? (
            <>
              <div className="results-list">
                {results.map((test) => (
                  <div
                    key={test.testId}
                    className="result-item"
                    onClick={() => handleSelectTest(test)}
                  >
                    <div className="result-header">
                      <strong className="test-name">{test.name}</strong>
                      <span className="price-badge">₹{test.price}</span>
                    </div>
                    <div className="result-details">
                      {test.category && (
                        <span className="category-tag">{test.category}</span>
                      )}
                      {test.unit && (
                        <span className="unit-text">Unit: {test.unit}</span>
                      )}
                    </div>
                    {(test.refLow || test.refHigh || test.refText) && (
                      <div className="reference-text">
                        {test.refLow && test.refHigh ? (
                          <span>Ref: {test.refLow}–{test.refHigh} {test.unit}</span>
                        ) : test.refText ? (
                          <span>Ref: {test.refText}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <p>Not found — try adding manually.</p>
              {onAddManual && (
                <button className="btn-add-manual" onClick={handleAddManual}>
                  <Plus size={18} />
                  Add New Test Manually
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAddTest;
