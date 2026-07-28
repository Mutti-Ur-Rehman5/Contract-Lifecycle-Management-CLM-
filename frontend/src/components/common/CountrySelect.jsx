import { useState, useRef, useEffect } from 'react';
import countries from '../../data/countries.js';

function CountrySelect({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = countries.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [search]);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightIdx]) {
        onChange(filtered[highlightIdx]);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSelect = (country) => {
    onChange(country);
    setOpen(false);
  };

  return (
    <div className="country-select">
      <div
        className="form-input country-select-trigger"
        onClick={() => setOpen(!open)}
        role="combobox"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
      >
        {value || <span className="country-placeholder">{placeholder || 'Select a country'}</span>}
        <span className={`country-arrow ${open ? 'open' : ''}`}>&#9662;</span>
      </div>

      {open && (
        <div className="country-dropdown">
          <div className="country-search-wrap">
            <input
              ref={inputRef}
              className="country-search"
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <ul className="country-list" ref={listRef}>
            {filtered.length === 0 && (
              <li className="country-item country-empty">No countries found</li>
            )}
            {filtered.map((c, i) => (
              <li
                key={c}
                className={`country-item ${c === value ? 'selected' : ''} ${i === highlightIdx ? 'highlighted' : ''}`}
                onClick={() => handleSelect(c)}
                onMouseEnter={() => setHighlightIdx(i)}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CountrySelect;
