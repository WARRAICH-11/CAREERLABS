import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Jobs.css';

const JobApplicationForm = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { userInfo } = useSelector(state => state.userLogin);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [coverNote, setCoverNote] = useState('');
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const [coverLetterError, setCoverLetterError] = useState('');
  
  // Check file size and type
  const validateFile = (file, fileType) => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return "File size exceeds 5MB limit";
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return "Only PDF, DOC, and DOCX files are allowed";
    }
    
    return "";
  };
  
  // Handle resume file selection
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateFile(file);
      setResumeError(error);
      if (!error) {
        setResume(file);
      } else {
        setResume(null);
      }
    }
  };
  
  // Handle cover letter file selection
  const handleCoverLetterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateFile(file);
      setCoverLetterError(error);
      if (!error) {
        setCoverLetter(file);
      } else {
        setCoverLetter(null);
      }
    }
  };
  
  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        });
        setJob(data);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load job details');
        setLoading(false);
      }
    };
    
    if (userInfo && userInfo.token) {
      fetchJob();
    } else {
      navigate('/login');
    }
  }, [jobId, userInfo, navigate]);
  
  // Submit job application
  const submitHandler = async (e) => {
    e.preventDefault();
    
    // Validate required files
    if (!resume) {
      setResumeError('Resume is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('coverNote', coverNote);
      formData.append('resume', resume);
      
      if (coverLetter) {
        formData.append('coverLetter', coverLetter);
      }
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      const { data } = await axios.post('/api/applications/submit', formData, config);
      
      setSubmitting(false);
      setSuccess(true);
      toast.success('Application submitted successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/applications');
      }, 2000);
      
    } catch (error) {
      setSubmitting(false);
      setError(error.response?.data?.message || 'Error submitting application');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading job details...</p>
      </div>
    );
  }
  
  if (error && !job) {
    return (
      <Alert variant="danger" className="my-4">
        {error}
      </Alert>
    );
  }
  
  if (success) {
    return (
      <Alert variant="success" className="my-4">
        Your application was submitted successfully! You will be redirected to your applications page.
      </Alert>
    );
  }
  
  return (
    <div className="job-application-container">
      <h2 className="mb-4">Apply for Position</h2>
      
      {job && (
        <Card className="mb-4 job-details-card">
          <Card.Body>
            <Card.Title>{job.title}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{job.company}</Card.Subtitle>
            <div className="job-meta">
              <span className="location"><i className="fas fa-map-marker-alt"></i> {job.location}</span>
              <span className="job-type"><i className="fas fa-briefcase"></i> {job.jobType}</span>
              {job.salary && (
                <span className="salary"><i className="fas fa-money-bill-wave"></i> {job.salary}</span>
              )}
            </div>
          </Card.Body>
        </Card>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3">
          <Form.Label>Resume/CV <span className="text-danger">*</span></Form.Label>
          <Form.Control 
            type="file" 
            onChange={handleResumeChange}
            isInvalid={!!resumeError}
          />
          <Form.Text className="text-muted">
            Upload your resume (PDF, DOC, or DOCX format, max 5MB)
          </Form.Text>
          <Form.Control.Feedback type="invalid">
            {resumeError}
          </Form.Control.Feedback>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Cover Letter (Optional)</Form.Label>
          <Form.Control 
            type="file" 
            onChange={handleCoverLetterChange}
            isInvalid={!!coverLetterError}
          />
          <Form.Text className="text-muted">
            Upload your cover letter (PDF, DOC, or DOCX format, max 5MB)
          </Form.Text>
          <Form.Control.Feedback type="invalid">
            {coverLetterError}
          </Form.Control.Feedback>
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Cover Note</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Briefly explain why you are interested in this position and why you would be a good fit."
          />
        </Form.Group>
        
        <div className="d-flex justify-content-between mt-4">
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/jobs/${jobId}`)}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            variant="primary" 
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default JobApplicationForm; 