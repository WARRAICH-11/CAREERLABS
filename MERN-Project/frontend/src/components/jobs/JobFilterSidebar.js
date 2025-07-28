import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFilter, FaTimes } from 'react-icons/fa';
import './Jobs.css';

const JobFilterSidebar = ({ filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [industries, setIndustries] = useState([]);
  
  useEffect(() => {
    // Fetch categories and industries from API
    const fetchFilterOptions = async () => {
      try {
        // This would normally be an API call to get all available categories and industries
        // For now, we'll use hardcoded values
        setCategories([
          'Software Development', 
          'Data Science', 
          'Design', 
          'Marketing', 
          'Sales', 
          'Customer Support',
          'Human Resources',
          'Finance',
          'Product Management',
          'Project Management'
        ]);
        
        setIndustries([
          'Technology',
          'Healthcare',
          'Finance',
          'Education',
          'Manufacturing',
          'Retail',
          'Media',
          'Consulting',
          'Non-profit',
          'Government'
        ]);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    onFilterChange({ [name]: checked });
  };
  
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };
  
  const handleSalaryChange = (e) => {
    const { value } = e.target;
    onFilterChange({ minSalary: value });
  };
  
  const clearFilters = () => {
    onFilterChange({
      remote: false,
      jobType: '',
      experienceLevel: '',
      industry: '',
      minSalary: ''
    });
  };
  
  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'title' || key === 'location' || key === 'sort' || key === 'order') return false;
    if (typeof value === 'boolean' && value) return true;
    if (typeof value === 'string' && value) return true;
    return false;
  }).length;
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  return (
    <>
      <div className={`job-filter-sidebar ${showFilters ? 'show' : ''}`}>
        <div className="filter-header">
          <h3>Filters</h3>
          <button 
            className="clear-filters-button" 
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
          >
            Clear all
          </button>
          <button className="close-filters-button" onClick={toggleFilters}>
            <FaTimes />
          </button>
        </div>
        
        <div className="filter-section">
          <h4>Job Type</h4>
          <div className="filter-options">
            <div className="filter-option">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="remote" 
                  checked={filters.remote} 
                  onChange={handleCheckboxChange} 
                />
                Remote Only
              </label>
            </div>
            
            <div className="filter-option">
              <select 
                name="jobType" 
                value={filters.jobType} 
                onChange={handleSelectChange}
                className="filter-select"
              >
                <option value="">All Job Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="filter-section">
          <h4>Experience Level</h4>
          <div className="filter-options">
            <div className="filter-option">
              <select 
                name="experienceLevel" 
                value={filters.experienceLevel} 
                onChange={handleSelectChange}
                className="filter-select"
              >
                <option value="">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="filter-section">
          <h4>Category</h4>
          <div className="filter-options">
            <div className="filter-option">
              <select 
                name="category" 
                value={filters.category} 
                onChange={handleSelectChange}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="filter-section">
          <h4>Industry</h4>
          <div className="filter-options">
            <div className="filter-option">
              <select 
                name="industry" 
                value={filters.industry} 
                onChange={handleSelectChange}
                className="filter-select"
              >
                <option value="">All Industries</option>
                {industries.map((industry, index) => (
                  <option key={index} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="filter-section">
          <h4>Salary</h4>
          <div className="filter-options">
            <div className="filter-option">
              <select 
                name="minSalary" 
                value={filters.minSalary} 
                onChange={handleSalaryChange}
                className="filter-select"
              >
                <option value="">Any Salary</option>
                <option value="30000">$30,000+</option>
                <option value="50000">$50,000+</option>
                <option value="70000">$70,000+</option>
                <option value="100000">$100,000+</option>
                <option value="150000">$150,000+</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <button className="filter-toggle-button" onClick={toggleFilters}>
        <FaFilter />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="filter-count">{activeFilterCount}</span>
        )}
      </button>
      
      {showFilters && <div className="filter-overlay" onClick={toggleFilters}></div>}
    </>
  );
};

export default JobFilterSidebar; 