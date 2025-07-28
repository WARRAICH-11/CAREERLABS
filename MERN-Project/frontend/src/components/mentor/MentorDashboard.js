import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Table, Badge, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faUsers, faStar, faClock, faCheckCircle, faTimesCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Mentor.css';

const MentorDashboard = () => {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    reviewScore: 0,
    completionRate: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [timeSlots] = useState([
    "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ]);
  const [daysOfWeek] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch upcoming sessions
        const upcomingRes = await axios.get('/api/mentors/sessions/upcoming');
        setUpcomingSessions(upcomingRes.data);
        
        // Fetch past sessions
        const pastRes = await axios.get('/api/mentors/sessions/past');
        setPastSessions(pastRes.data);
        
        // Fetch mentor stats
        const statsRes = await axios.get('/api/mentors/stats');
        setStats(statsRes.data);
        
        // Fetch availability
        const availRes = await axios.get('/api/mentors/availability');
        setAvailability(availRes.data);
        
        // Convert availability data to selected time slots format
        const availabilityMap = {};
        availRes.data.forEach(slot => {
          if (!availabilityMap[slot.day]) {
            availabilityMap[slot.day] = [];
          }
          availabilityMap[slot.day].push(slot.time);
        });
        setSelectedTimeSlots(availabilityMap);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const handleSlotToggle = (day, time) => {
    setSelectedTimeSlots(prev => {
      const newSlots = { ...prev };
      
      if (!newSlots[day]) {
        newSlots[day] = [];
      }
      
      if (newSlots[day].includes(time)) {
        newSlots[day] = newSlots[day].filter(t => t !== time);
      } else {
        newSlots[day] = [...newSlots[day], time];
      }
      
      return newSlots;
    });
  };
  
  const saveAvailability = async () => {
    try {
      const availabilityData = [];
      
      Object.entries(selectedTimeSlots).forEach(([day, times]) => {
        times.forEach(time => {
          availabilityData.push({ day, time });
        });
      });
      
      await axios.post('/api/mentors/availability', { availability: availabilityData });
      alert('Availability saved successfully!');
    } catch (err) {
      console.error('Error saving availability:', err);
      alert('Failed to save availability. Please try again.');
    }
  };
  
  const updateSessionStatus = async (sessionId, status) => {
    try {
      await axios.patch(`/api/mentors/sessions/${sessionId}`, { status });
      
      // Refresh upcoming sessions
      const upcomingRes = await axios.get('/api/mentors/sessions/upcoming');
      setUpcomingSessions(upcomingRes.data);
      
      // Refresh stats
      const statsRes = await axios.get('/api/mentors/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error updating session status:', err);
      alert('Failed to update session status. Please try again.');
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatTime = (timeString) => {
    return timeString;
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading mentor dashboard...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="mentor-dashboard py-4">
      <h1 className="dashboard-title mb-4">Mentor Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>
              <h3 className="stat-value">{stats.totalSessions}</h3>
              <p className="stat-label">Total Sessions</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon">
                <FontAwesomeIcon icon={faStar} />
              </div>
              <h3 className="stat-value">{stats.reviewScore.toFixed(1)}</h3>
              <p className="stat-label">Avg. Rating</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <h3 className="stat-value">{stats.completionRate}%</h3>
              <p className="stat-label">Completion Rate</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <h3 className="stat-value">{stats.totalStudents}</h3>
              <p className="stat-label">Students Helped</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Tabs defaultActiveKey="upcoming" className="mb-3">
            <Tab eventKey="upcoming" title="Upcoming Sessions">
              {upcomingSessions.length > 0 ? (
                <Table responsive className="session-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Date & Time</th>
                      <th>Topic</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingSessions.map(session => (
                      <tr key={session._id}>
                        <td>
                          <div className="student-info">
                            <img 
                              src={session.student.profileImage || 'https://via.placeholder.com/40'} 
                              alt={session.student.name}
                              className="student-avatar" 
                            />
                            <div>
                              <p className="student-name">{session.student.name}</p>
                              <p className="student-email">{session.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="session-datetime">
                            <p className="session-date">{formatDate(session.date)}</p>
                            <p className="session-time">{formatTime(session.timeSlot)}</p>
                          </div>
                        </td>
                        <td>{session.topic || 'General Mentoring'}</td>
                        <td>
                          <div className="session-actions">
                            <a 
                              href={`/messages/${session.student._id}`}
                              className="btn btn-sm btn-primary me-2"
                            >
                              Message
                            </a>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => updateSessionStatus(session._id, 'completed')}
                            >
                              Complete
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="ms-2"
                              onClick={() => updateSessionStatus(session._id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No upcoming sessions. Make sure your availability is up-to-date.</p>
              )}
            </Tab>
            
            <Tab eventKey="past" title="Past Sessions">
              {pastSessions.length > 0 ? (
                <Table responsive className="session-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Topic</th>
                      <th>Status</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessions.map(session => (
                      <tr key={session._id}>
                        <td>
                          <div className="student-info">
                            <img 
                              src={session.student.profileImage || 'https://via.placeholder.com/40'} 
                              alt={session.student.name}
                              className="student-avatar" 
                            />
                            <div>
                              <p className="student-name">{session.student.name}</p>
                              <p className="student-email">{session.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="session-date">{formatDate(session.date)}</p>
                          <p className="session-time">{formatTime(session.timeSlot)}</p>
                        </td>
                        <td>{session.topic || 'General Mentoring'}</td>
                        <td>
                          <Badge 
                            bg={
                              session.status === 'completed' ? 'success' : 
                              session.status === 'cancelled' ? 'danger' : 'warning'
                            }
                          >
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          {session.rating ? (
                            <div className="rating-stars">
                              {[...Array(5)].map((_, i) => (
                                <FontAwesomeIcon 
                                  key={i}
                                  icon={faStar}
                                  className={i < session.rating ? 'text-warning' : 'text-muted'}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">No rating</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No past sessions.</p>
              )}
            </Tab>
            
            <Tab eventKey="availability" title="Manage Availability">
              <div className="availability-section">
                <div className="availability-header mb-4">
                  <h4>Set Your Regular Availability</h4>
                  <p className="text-muted">
                    Select the time slots when you're regularly available for mentoring sessions each week.
                  </p>
                </div>
                
                <div className="availability-grid">
                  <div className="time-header"></div>
                  {daysOfWeek.map(day => (
                    <div className="day-header" key={day}>{day}</div>
                  ))}
                  
                  {timeSlots.map(time => (
                    <React.Fragment key={time}>
                      <div className="time-label">{time}</div>
                      {daysOfWeek.map(day => (
                        <div 
                          className={`time-slot ${selectedTimeSlots[day]?.includes(time) ? 'selected' : ''}`}
                          key={`${day}-${time}`}
                          onClick={() => handleSlotToggle(day, time)}
                        ></div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="availability-actions mt-4">
                  <Button variant="primary" onClick={saveAvailability}>
                    Save Availability
                  </Button>
                </div>
                
                <div className="mt-5">
                  <h4>Block Specific Dates</h4>
                  <p className="text-muted">
                    If you need to block specific dates (vacation, personal days, etc.), you can do so here.
                  </p>
                  
                  <Row className="mt-4">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Select Date Range</Form.Label>
                        <div className="d-flex gap-2">
                          <DatePicker
                            selected={selectedDate}
                            onChange={date => setSelectedDate(date)}
                            className="form-control"
                            minDate={new Date()}
                          />
                          <Button variant="outline-secondary">
                            Add Blocked Date
                          </Button>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="blocked-dates mt-3">
                    <h5>Currently Blocked Dates</h5>
                    {/* This would be populated from the API */}
                    <p className="text-muted">No blocked dates.</p>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MentorDashboard; 