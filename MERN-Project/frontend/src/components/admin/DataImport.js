import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const DataImport = () => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'directory'
  const [skillsFile, setSkillsFile] = useState(null);
  const [jobsFile, setJobsFile] = useState(null);
  const [directoryPath, setDirectoryPath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [error, setError] = useState(null);

  // Fetch import logs on component mount
  useEffect(() => {
    fetchImportLogs();
  }, []);

  const fetchImportLogs = async () => {
    try {
      const res = await axios.get('/import/status');
      if (res.data.success) {
        setImportLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch import logs:', err);
      setError('Failed to fetch import logs');
    }
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (fileType === 'skills') {
        setSkillsFile(file);
      } else {
        setJobsFile(file);
      }
    }
  };

  const handleDirectoryPathChange = (e) => {
    setDirectoryPath(e.target.value);
  };

  const handleUploadModeChange = (mode) => {
    setUploadMode(mode);
    // Reset state when changing modes
    setImportResult(null);
    setError(null);
  };

  const validateFiles = () => {
    if (!skillsFile) {
      setError('Skills file is required');
      return false;
    }
    if (!jobsFile) {
      setError('Jobs file is required');
      return false;
    }
    return true;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!validateFiles()) return;
    
    setIsSubmitting(true);
    setError(null);
    setImportResult(null);
    
    const formData = new FormData();
    formData.append('skills', skillsFile);
    formData.append('jobs', jobsFile);
    
    try {
      const res = await axios.post('/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setImportResult(res.data);
      // Refresh import logs
      fetchImportLogs();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectoryImport = async (e) => {
    e.preventDefault();
    
    if (!directoryPath.trim()) {
      setError('Directory path is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setImportResult(null);
    
    try {
      const res = await axios.post('/import/directory', { directoryPath });
      
      setImportResult(res.data);
      // Refresh import logs
      fetchImportLogs();
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Data Import</h1>
      </div>
      
      <div className="admin-card">
        <div className="mode-selector">
          <button 
            className={`mode-button ${uploadMode === 'file' ? 'active' : ''}`}
            onClick={() => handleUploadModeChange('file')}
          >
            File Upload
          </button>
          <button 
            className={`mode-button ${uploadMode === 'directory' ? 'active' : ''}`}
            onClick={() => handleUploadModeChange('directory')}
          >
            Directory Path
          </button>
        </div>
        
        {uploadMode === 'file' ? (
          <form onSubmit={handleFileUpload} className="upload-form">
            <div className="form-group">
              <label htmlFor="skills-file">Skills File (JSON):</label>
              <input 
                type="file" 
                id="skills-file" 
                accept=".json,application/json"
                onChange={(e) => handleFileChange(e, 'skills')}
              />
              {skillsFile && <div className="file-info">Selected: {skillsFile.name}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="jobs-file">Jobs File (JSON):</label>
              <input 
                type="file" 
                id="jobs-file" 
                accept=".json,application/json"
                onChange={(e) => handleFileChange(e, 'jobs')}
              />
              {jobsFile && <div className="file-info">Selected: {jobsFile.name}</div>}
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="admin-button primary-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Uploading...' : 'Upload and Import'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleDirectoryImport} className="directory-form">
            <div className="form-group">
              <label htmlFor="directory-path">Directory Path:</label>
              <input 
                type="text" 
                id="directory-path" 
                placeholder="e.g., C:/Users/admin/Desktop/DATASET"
                value={directoryPath}
                onChange={handleDirectoryPathChange}
              />
              <div className="path-info">
                Directory should contain skills.json and jobs.json files
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="admin-button primary-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </form>
        )}
        
        {error && <div className="admin-error">{error}</div>}
        
        {importResult && (
          <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
            <h3>Import Results</h3>
            <p>{importResult.message}</p>
            
            {importResult.success && importResult.data && (
              <div className="import-stats">
                <div className="stat-group">
                  <h4>Skills</h4>
                  <p>Total: {importResult.data.skills.total}</p>
                  <p>Imported: {importResult.data.skills.imported}</p>
                  <p>Skipped: {importResult.data.skills.skipped}</p>
                </div>
                <div className="stat-group">
                  <h4>Jobs</h4>
                  <p>Total: {importResult.data.jobs.total}</p>
                  <p>Imported: {importResult.data.jobs.imported}</p>
                  <p>Skipped: {importResult.data.jobs.skipped}</p>
                </div>
              </div>
            )}
            
            {!importResult.success && importResult.data && importResult.data.error && (
              <div className="error-details">
                <h4>Error Details</h4>
                <p>{importResult.data.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {importLogs.length > 0 && (
        <div className="admin-card">
          <h2>Import History</h2>
          <div className="import-logs">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Skills Imported</th>
                  <th>Jobs Imported</th>
                  <th>Skills Skipped</th>
                  <th>Jobs Skipped</th>
                </tr>
              </thead>
              <tbody>
                {importLogs.map((log, index) => (
                  <tr key={index} className={log.success ? 'success-row' : 'error-row'}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.success ? 'Success' : 'Failed'}</td>
                    <td>{log.skillsImported}</td>
                    <td>{log.jobsImported}</td>
                    <td>{log.skillsSkipped}</td>
                    <td>{log.jobsSkipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImport; 