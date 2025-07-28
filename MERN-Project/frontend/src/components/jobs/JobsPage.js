import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import JobCard from './JobCard';
import JobFilterSidebar from './JobFilterSidebar';
import SearchBar from './SearchBar';
import Pagination from '../common/Pagination';
import Loader from '../common/Loader';
import './Jobs.css';

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: parseInt(searchParams.get('page')) || 1,
    totalPages: 0,
    totalItems: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    title: searchParams.get('title') || '',
    location: searchParams.get('location') || '',
    remote: searchParams.get('remote') === 'true',
    jobType: searchParams.get('jobType') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    industry: searchParams.get('industry') || '',
    minSalary: searchParams.get('minSalary') || '',
    sort: searchParams.get('sort') || 'createdAt',
    order: searchParams.get('order') || 'desc'
  });
  
  // Fetch jobs using filters and pagination
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        if (filters.title) queryParams.append('title', filters.title);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.remote) queryParams.append('remote', 'true');
        if (filters.jobType) queryParams.append('jobType', filters.jobType);
        if (filters.experienceLevel) queryParams.append('experienceLevel', filters.experienceLevel);
        if (filters.industry) queryParams.append('industry', filters.industry);
        if (filters.minSalary) queryParams.append('minSalary', filters.minSalary);
        
        queryParams.append('sort', filters.sort);
        queryParams.append('order', filters.order);
        queryParams.append('page', pagination.currentPage);
        queryParams.append('limit', 10); // Fixed limit for now
        
        // Update URL without refreshing
        setSearchParams(queryParams);
        
        const headers = {};
        if (currentUser) {
          headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
        }
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/jobs?${queryParams.toString()}`,
          { headers }
        );
        
        if (response.data.success) {
          setJobs(response.data.data);
          setPagination({
            ...pagination,
            totalPages: response.data.pagination.pages,
            totalItems: response.data.pagination.total
          });
        } else {
          setError('Failed to fetch jobs');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [filters, pagination.currentPage, currentUser]);
  
  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
    window.scrollTo(0, 0);
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, currentPage: 1 }); // Reset to page 1 when filters change
  };
  
  const handleSortChange = (e) => {
    const value = e.target.value;
    let sort = 'createdAt';
    let order = 'desc';
    
    switch (value) {
      case 'newest':
        sort = 'createdAt';
        order = 'desc';
        break;
      case 'oldest':
        sort = 'createdAt';
        order = 'asc';
        break;
      case 'salary-high':
        sort = 'salary.min';
        order = 'desc';
        break;
      case 'salary-low':
        sort = 'salary.min';
        order = 'asc';
        break;
      default:
        break;
    }
    
    setFilters({ ...filters, sort, order });
    setPagination({ ...pagination, currentPage: 1 });
  };
  
  const handleSearch = (searchData) => {
    handleFilterChange({
      title: searchData.query,
      location: searchData.location
    });
  };
  
  const handleSaveJob = async (jobId) => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      };
      
      const job = jobs.find(j => j._id === jobId);
      
      if (job.isSaved) {
        // Unsave the job
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/jobs/${jobId}/save`,
          { headers }
        );
      } else {
        // Save the job
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/jobs/${jobId}/save`,
          {},
          { headers }
        );
      }
      
      // Update local job state
      setJobs(jobs.map(j => 
        j._id === jobId ? { ...j, isSaved: !j.isSaved } : j
      ));
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };
  
  return (
    <div className="jobs-page-container">
      <div className="jobs-header">
        <h1>Find Your Next Career Opportunity</h1>
        <p>Browse through thousands of job opportunities</p>
        <SearchBar onSearch={handleSearch} initialValues={{ query: filters.title, location: filters.location }} />
      </div>
      
      <div className="jobs-content">
        <JobFilterSidebar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
        />
        
        <div className="jobs-list-container">
          <div className="jobs-list-header">
            <div className="jobs-count">
              {loading ? 'Loading...' : `${pagination.totalItems} jobs found`}
            </div>
            <div className="jobs-sort">
              <label htmlFor="sort-select">Sort by:</label>
              <select 
                id="sort-select" 
                value={
                  filters.sort === 'createdAt' && filters.order === 'desc'
                    ? 'newest'
                    : filters.sort === 'createdAt' && filters.order === 'asc'
                    ? 'oldest'
                    : filters.sort === 'salary.min' && filters.order === 'desc'
                    ? 'salary-high'
                    : 'salary-low'
                }
                onChange={handleSortChange}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="salary-high">Highest salary</option>
                <option value="salary-low">Lowest salary</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <Loader message="Loading jobs..." />
          ) : error ? (
            <div className="jobs-error">
              <h3>Error</h3>
              <p>{error}</p>
              <button onClick={() => setLoading(true)}>Retry</button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="jobs-empty">
              <h3>No jobs found</h3>
              <p>Try adjusting your search filters or check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="jobs-list">
              {jobs.map(job => (
                <JobCard 
                  key={job._id} 
                  job={job} 
                  onSave={() => handleSaveJob(job._id)}
                />
              ))}
            </div>
          )}
          
          {!loading && !error && pagination.totalPages > 1 && (
            <Pagination 
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage; 