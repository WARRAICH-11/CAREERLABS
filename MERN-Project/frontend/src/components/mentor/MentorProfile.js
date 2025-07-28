import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Tabs, Tab, Badge, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faVideo, faGraduationCap, faBriefcase, faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Mentor.css';

const MentorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  useEffect(() => {
    const fetchMentorData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/mentors/${id}`);
        setMentor(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load mentor profile. Please try again later.');
        console.error('Error fetching mentor data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMentorData();
  }, [id]);
  
  useEffect(() => {
    if (mentor && selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [mentor, selectedDate]);
  
  const fetchAvailableSlots = async (date) => {
    try {
      const response = await axios.get(`/api/mentors/${id}/availability`, {
        params: {
          date: date.toISOString().split('T')[0]
        }
      });
      setAvailableSlots(response.data.availableSlots || []);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setAvailableSlots([]);
    }
  };
  
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };
  
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };
  
  const handleBookSession = async () => {
    if (!selectedSlot) {
      setBookingMessage('Please select a time slot');
      return;
    }
    
    try {
      const response = await axios.post('/api/mentors/sessions/book', {
        mentorId: id,
        date: selectedDate.toISOString().split('T')[0],
        timeSlot: selectedSlot,
        message: bookingMessage
      });
      
      setBookingSuccess(true);
      
      // Redirect to sessions page or show success message
      setTimeout(() => {
        navigate('/dashboard/sessions');
      }, 3000);
      
    } catch (err) {
      console.error('Error booking session:', err);
      alert('Failed to book session. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading mentor profile...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Button variant="outline-primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }
  
  if (!mentor) return null;
  
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={i <= rating ? "text-warning" : "text-muted"}
        />
      );
    }
    return stars;
  };

  return (
    <Container className="mentor-profile-container">
      <Row>
        <Col lg={8}>
          <div className="mentor-profile-header">
            <Card className="mentor-profile-card">
              <div className="mentor-header-content">
                <img 
                  src={mentor.profileImage || 'https://via.placeholder.com/150'} 
                  alt={mentor.name} 
                  className="mentor-avatar" 
                />
                <div className="mentor-info">
                  <h1 className="mentor-name">{mentor.name}</h1>
                  <p className="mentor-title">{mentor.title}</p>
                  <div className="mb-2">
                    {renderStars(mentor.rating)}
                    <span className="ms-2">({mentor.reviewCount} reviews)</span>
                  </div>
                  <div className="mentor-stats">
                    <div className="mentor-stat">
                      <span className="mentor-stat-value">{mentor.sessionCount}</span>
                      <span className="mentor-stat-label">Sessions</span>
                    </div>
                    <div className="mentor-stat">
                      <span className="mentor-stat-value">{mentor.responseRate}%</span>
                      <span className="mentor-stat-label">Response Rate</span>
                    </div>
                    <div className="mentor-stat">
                      <span className="mentor-stat-value">{mentor.yearsExperience}</span>
                      <span className="mentor-stat-label">Years Exp.</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="mb-4">
            <Card.Body>
              <Tabs defaultActiveKey="about" className="mb-3">
                <Tab eventKey="about" title="About">
                  <div className="tab-content-wrapper">
                    <h4 className="mentor-section-title">About Me</h4>
                    <p>{mentor.bio}</p>
                    
                    <h4 className="mentor-section-title">Skills</h4>
                    <div className="tags-container">
                      {mentor.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                </Tab>
                
                <Tab eventKey="experience" title="Experience">
                  <div className="tab-content-wrapper">
                    <h4 className="mentor-section-title">
                      <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                      Work Experience
                    </h4>
                    
                    {mentor.experience.map((exp, index) => (
                      <div key={index} className="experience-item">
                        <h5 className="experience-title">{exp.title}</h5>
                        <p className="experience-company">{exp.company}</p>
                        <p className="experience-date">{exp.startDate} - {exp.endDate || 'Present'}</p>
                        <p>{exp.description}</p>
                      </div>
                    ))}
                    
                    <h4 className="mentor-section-title">
                      <FontAwesomeIcon icon={faGraduationCap} className="me-2" />
                      Education
                    </h4>
                    
                    {mentor.education.map((edu, index) => (
                      <div key={index} className="education-item">
                        <h5 className="education-degree">{edu.degree}</h5>
                        <p className="education-institution">{edu.institution}</p>
                        <p className="education-date">{edu.startYear} - {edu.endYear || 'Present'}</p>
                        {edu.description && <p>{edu.description}</p>}
                      </div>
                    ))}
                  </div>
                </Tab>
                
                <Tab eventKey="reviews" title={`Reviews (${mentor.reviews.length})`}>
                  <div className="tab-content-wrapper">
                    {mentor.reviews.length > 0 ? (
                      mentor.reviews.map((review, index) => (
                        <div key={index} className="review-container">
                          <div className="review-rating">
                            {renderStars(review.rating)}
                          </div>
                          <p className="review-name">{review.studentName}</p>
                          <p className="review-date">{new Date(review.date).toLocaleDateString()}</p>
                          <p>{review.comment}</p>
                          <hr />
                        </div>
                      ))
                    ) : (
                      <p>No reviews yet.</p>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="booking-card">
            <Card.Body>
              <h4 className="mb-3">Book a Session</h4>
              <p className="mentor-price">${mentor.hourlyRate}/hour</p>
              
              {bookingSuccess ? (
                <div className="alert alert-success">
                  <h5>Booking Successful!</h5>
                  <p>Your session has been booked. Redirecting to your sessions...</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Select Date
                    </label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      minDate={new Date()}
                      className="form-control"
                      dateFormat="MMMM d, yyyy"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faClock} className="me-2" />
                      Available Time Slots
                    </label>
                    
                    {availableSlots.length > 0 ? (
                      <div className="time-slots">
                        {availableSlots.map((slot, index) => (
                          <div
                            key={index}
                            className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                            onClick={() => handleSlotSelect(slot)}
                          >
                            {slot}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No available slots for this date</p>
                    )}
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Message (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Let the mentor know what you'd like to discuss..."
                      value={bookingMessage}
                      onChange={(e) => setBookingMessage(e.target.value)}
                    />
                  </Form.Group>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100"
                    onClick={handleBookSession}
                    disabled={!selectedSlot}
                  >
                    <FontAwesomeIcon icon={faVideo} className="me-2" />
                    Book Session
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MentorProfile; 