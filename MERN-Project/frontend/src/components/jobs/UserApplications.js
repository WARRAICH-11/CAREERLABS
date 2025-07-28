import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Spinner, Alert, Table } from 'react-bootstrap';
import axios from 'axios';
import { format } from 'date-fns';
import './Jobs.css';

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'reviewing':
      return 'info';
    case 'shortlisted':
      return 'primary';
    case 'interview':
      return 'warning';
    case 'offered':
      return 'success';
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'withdrawn':
      return 'dark';
    default:
      return 'secondary';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'reviewing':
      return 'Under Review';
    case 'shortlisted':
      return 'Shortlisted';
    case 'interview':
      return 'Interview Stage';
    case 'offered':
      return 'Job Offered';
    case 'accepted':
      return 'Offer Accepted';
    case 'rejected':
      return 'Not Selected';
    case 'withdrawn':
      return 'Application Withdrawn';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const UserApplications = () => {
  const { userInfo } = useSelector(state => state.userLogin);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/applications/user', {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        });
        setApplications(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your applications');
        setLoading(false);
      }
    };
    
    if (userInfo && userInfo.token) {
      fetchApplications();
    }
  }, [userInfo]);
  
  const handleWithdrawApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      try {
        setWithdrawingId(applicationId);
        await axios.put(`/api/applications/${applicationId}/withdraw`, {}, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        });
        
        // Update the application in the state
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, status: 'withdrawn' } : app
        ));
        
        setWithdrawingId(null);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to withdraw application');
        setWithdrawingId(null);
      }
    }
  };
  
  const downloadDocument = async (fileId, fileName) => {
    try {
      const response = await axios.get(`/api/applications/download/${fileId}`, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        },
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      // Append to html page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Error downloading document');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your applications...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        {error}
      </Alert>
    );
  }
  
  if (applications.length === 0) {
    return (
      <div className="applications-container">
        <h2 className="mb-4">My Applications</h2>
        <Alert variant="info">
          You haven't applied for any jobs yet. 
          <div className="mt-3">
            <Link to="/jobs" className="btn btn-primary">
              Browse Jobs
            </Link>
          </div>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="applications-container">
      <h2 className="mb-4">My Applications</h2>
      
      <div className="applications-summary mb-4">
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between flex-wrap">
              <div className="application-stat">
                <h3>{applications.length}</h3>
                <p>Total Applications</p>
              </div>
              <div className="application-stat">
                <h3>{applications.filter(app => app.status === 'pending' || app.status === 'reviewing').length}</h3>
                <p>Under Review</p>
              </div>
              <div className="application-stat">
                <h3>{applications.filter(app => app.status === 'shortlisted' || app.status === 'interview').length}</h3>
                <p>In Progress</p>
              </div>
              <div className="application-stat">
                <h3>{applications.filter(app => app.status === 'offered' || app.status === 'accepted').length}</h3>
                <p>Offers</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
      
      <Table responsive className="applications-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Application Date</th>
            <th>Status</th>
            <th>Documents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(application => (
            <tr key={application._id} className="application-row">
              <td>
                <div className="job-info">
                  <Link to={`/jobs/${application.job._id}`} className="job-title">
                    {application.job.title}
                  </Link>
                  <div className="company-name">{application.job.company}</div>
                  {application.job.location && (
                    <div className="job-location small text-muted">
                      <i className="fas fa-map-marker-alt me-1"></i> {application.job.location}
                    </div>
                  )}
                </div>
              </td>
              <td>
                {format(new Date(application.applicationDate), 'MMM d, yyyy')}
              </td>
              <td>
                <Badge bg={getStatusBadgeVariant(application.status)}>
                  {getStatusText(application.status)}
                </Badge>
              </td>
              <td>
                <div className="application-documents">
                  {application.documents?.resume && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="me-2 document-button"
                      onClick={() => downloadDocument(
                        application.documents.resume.filename,
                        application.documents.resume.originalName
                      )}
                    >
                      <i className="fas fa-file-pdf me-1"></i> Resume
                    </Button>
                  )}
                  
                  {application.documents?.coverLetter && (
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="document-button"
                      onClick={() => downloadDocument(
                        application.documents.coverLetter.filename,
                        application.documents.coverLetter.originalName
                      )}
                    >
                      <i className="fas fa-file-alt me-1"></i> Cover Letter
                    </Button>
                  )}
                </div>
              </td>
              <td>
                <div className="application-actions">
                  <Link 
                    to={`/applications/${application._id}`} 
                    className="btn btn-outline-primary btn-sm me-2"
                  >
                    View Details
                  </Link>
                  
                  {(application.status === 'pending' || 
                    application.status === 'reviewing' || 
                    application.status === 'shortlisted') && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleWithdrawApplication(application._id)}
                      disabled={withdrawingId === application._id}
                    >
                      {withdrawingId === application._id ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                          Withdrawing...
                        </>
                      ) : (
                        'Withdraw'
                      )}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default UserApplications; 