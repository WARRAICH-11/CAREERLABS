import React, { useState } from 'react';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
import './Jobs.css';

const SearchBar = ({ onSearch, initialValues = { query: '', location: '' } }) => {
  const [query, setQuery] = useState(initialValues.query || '');
  const [location, setLocation] = useState(initialValues.location || '');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ query, location });
  };
  
  return (
    <form className="job-search-bar" onSubmit={handleSubmit}>
      <div className="search-input-group">
        <div className="search-icon">
          <FaSearch />
        </div>
        <input 
          type="text" 
          placeholder="Job title, keywords, or company" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="job-search-input"
        />
      </div>
      
      <div className="search-input-group">
        <div className="search-icon">
          <FaMapMarkerAlt />
        </div>
        <input 
          type="text" 
          placeholder="City, state, or 'Remote'" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="job-search-input"
        />
      </div>
      
      <button type="submit" className="search-button">
        Find Jobs
      </button>
    </form>
  );
};

export default SearchBar; 