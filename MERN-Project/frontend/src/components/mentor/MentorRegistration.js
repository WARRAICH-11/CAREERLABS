import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './Mentor.css';

const MentorRegistration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    bio: '',
    availability: {
      monday: { available: false, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: false, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: false, startTime: '09:00', endTime: '17:00' },
      thursday: { available: false, startTime: '09:00', endTime: '17:00' },
      friday: { available: false, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '09:00', endTime: '17:00' },
      sunday: { available: false, startTime: '09:00', endTime: '17:00' },
    },
    skills: [],
    education: [{ degree: '', institution: '', year: '' }],
    certifications: [{ name: '', issuer: '', year: '' }]
  });

  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingMentor, setExistingMentor] = useState(null);

  useEffect(() => {
    // Check if user is already a mentor
    const checkMentorStatus = async () => {
      if (userInfo && userInfo.token) {
        try {
          setLoading(true);
          const { data } = await axios.get('/api/mentors/profile', {
            headers: {
              Authorization: `Bearer ${userInfo.token}`
            }
          });
          if (data.mentor) {
            setExistingMentor(data.mentor);
            // Pre-fill form with existing data
            setFormData({
              specialization: data.mentor.specialization || '',
              experience: data.mentor.experience || '',
              bio: data.mentor.bio || '',
              availability: data.mentor.availability || formData.availability,
              skills: data.mentor.skills || [],
              education: data.mentor.education || [{ degree: '', institution: '', year: '' }],
              certifications: data.mentor.certifications || [{ name: '', issuer: '', year: '' }]
            });
          }
          setLoading(false);
        } catch (err) {
          if (err.response?.status !== 404) {
            setError(err.response?.data?.message || 'Failed to check mentor status');
          }
          setLoading(false);
        }
      }
    };

    checkMentorStatus();
  }, [userInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prevState => ({
      ...prevState,
      availability: {
        ...prevState.availability,
        [day]: {
          ...prevState.availability[day],
          available: !prevState.availability[day].available
        }
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setFormData(prevState => ({
      ...prevState,
      availability: {
        ...prevState.availability,
        [day]: {
          ...prevState.availability[day],
          [field]: value
        }
      }
    }));
  };

  const handleSkillAdd = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prevState => ({
        ...prevState,
        skills: [...prevState.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skill) => {
    setFormData(prevState => ({
      ...prevState,
      skills: prevState.skills.filter(s => s !== skill)
    }));
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...formData.education];
    newEducation[index][field] = value;
    setFormData(prevState => ({
      ...prevState,
      education: newEducation
    }));
  };

  const addEducation = () => {
    setFormData(prevState => ({
      ...prevState,
      education: [...prevState.education, { degree: '', institution: '', year: '' }]
    }));
  };

  const removeEducation = (index) => {
    if (formData.education.length > 1) {
      const newEducation = [...formData.education];
      newEducation.splice(index, 1);
      setFormData(prevState => ({
        ...prevState,
        education: newEducation
      }));
    }
  };

  const handleCertificationChange = (index, field, value) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index][field] = value;
    setFormData(prevState => ({
      ...prevState,
      certifications: newCertifications
    }));
  };

  const addCertification = () => {
    setFormData(prevState => ({
      ...prevState,
      certifications: [...prevState.certifications, { name: '', issuer: '', year: '' }]
    }));
  };

  const removeCertification = (index) => {
    if (formData.certifications.length > 1) {
      const newCertifications = [...formData.certifications];
      newCertifications.splice(index, 1);
      setFormData(prevState => ({
        ...prevState,
        certifications: newCertifications
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = existingMentor ? '/api/mentors/profile' : '/api/mentors';
      const method = existingMentor ? 'put' : 'post';
      
      await axios({
        method,
        url: endpoint,
        data: formData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      });

      setSuccess(true);
      setLoading(false);
      
      // Redirect to mentor dashboard after successful submission
      setTimeout(() => {
        navigate('/mentor/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (loading && !existingMentor) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <Container className="py-4">
      <Card className="mentor-registration-card">
        <Card.Header>
          <h1 className="card-title">{existingMentor ? 'Update Mentor Profile' : 'Become a Mentor'}</h1>
          <p className="text-muted">
            {existingMentor 
              ? 'Update your mentor profile information'
              : 'Fill out the form below to apply as a mentor and help guide other users in their career journey'}
          </p>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Successfully {existingMentor ? 'updated' : 'registered'} as a mentor!</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Specialization</Form.Label>
              <Form.Control
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="E.g. Career Transition, Interview Preparation"
                required
              />
              <Form.Text className="text-muted">
                Your main area of expertise for mentoring
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Experience (years)</Form.Label>
              <Form.Control
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                min="1"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Professional Bio</Form.Label>
              <Form.Control
                as="textarea"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Share your professional background, achievements, and mentoring philosophy"
                required
              />
            </Form.Group>

            <h3 className="section-title mb-3">Skills & Expertise</h3>
            <div className="skills-section mb-4">
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill (e.g. 'Resume Building', 'Technical Interviews')"
                />
                <Button 
                  variant="outline-primary" 
                  className="ms-2" 
                  onClick={handleSkillAdd}
                  type="button"
                >
                  Add
                </Button>
              </div>
              
              <div className="skills-tags mt-3">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="skill-remove-btn"
                      onClick={() => handleSkillRemove(skill)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {formData.skills.length === 0 && (
                  <p className="text-muted">No skills added yet</p>
                )}
              </div>
            </div>

            <h3 className="section-title mb-3">Availability</h3>
            <div className="availability-section mb-4">
              {days.map((day) => (
                <div key={day} className="availability-day">
                  <div className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      id={`day-${day}`}
                      label={day.charAt(0).toUpperCase() + day.slice(1)}
                      checked={formData.availability[day].available}
                      onChange={() => handleDayToggle(day)}
                      className="me-3"
                    />
                    {formData.availability[day].available && (
                      <div className="d-flex align-items-center time-inputs">
                        <Form.Control
                          type="time"
                          value={formData.availability[day].startTime}
                          onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                          className="time-input"
                        />
                        <span className="mx-2">to</span>
                        <Form.Control
                          type="time"
                          value={formData.availability[day].endTime}
                          onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                          className="time-input"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="section-title mb-3">Education</h3>
            <div className="education-section mb-4">
              {formData.education.map((edu, index) => (
                <div key={index} className="education-item mb-3 p-3 border rounded">
                  <Row>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Degree</Form.Label>
                        <Form.Control
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          placeholder="E.g. Bachelor's in Computer Science"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Institution</Form.Label>
                        <Form.Control
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                          placeholder="University/College name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Year</Form.Label>
                        <Form.Control
                          type="text"
                          value={edu.year}
                          onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                          placeholder="Year of completion"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={1} className="d-flex align-items-end">
                      {formData.education.length > 1 && (
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => removeEducation(index)}
                          type="button"
                          className="mt-4"
                        >
                          &times;
                        </Button>
                      )}
                    </Col>
                  </Row>
                </div>
              ))}
              <Button 
                variant="outline-secondary" 
                onClick={addEducation} 
                type="button"
                className="mt-2"
              >
                + Add Education
              </Button>
            </div>

            <h3 className="section-title mb-3">Certifications</h3>
            <div className="certifications-section mb-4">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="certification-item mb-3 p-3 border rounded">
                  <Row>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Certification Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={cert.name}
                          onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                          placeholder="E.g. AWS Certified Solutions Architect"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Issuing Organization</Form.Label>
                        <Form.Control
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => handleCertificationChange(index, 'issuer', e.target.value)}
                          placeholder="E.g. Amazon Web Services"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Year</Form.Label>
                        <Form.Control
                          type="text"
                          value={cert.year}
                          onChange={(e) => handleCertificationChange(index, 'year', e.target.value)}
                          placeholder="Year of completion"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={1} className="d-flex align-items-end">
                      {formData.certifications.length > 1 && (
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => removeCertification(index)}
                          type="button"
                          className="mt-4"
                        >
                          &times;
                        </Button>
                      )}
                    </Col>
                  </Row>
                </div>
              ))}
              <Button 
                variant="outline-secondary" 
                onClick={addCertification} 
                type="button"
                className="mt-2"
              >
                + Add Certification
              </Button>
            </div>

            <div className="d-grid gap-2 mt-4">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : existingMentor ? 'Update Profile' : 'Submit Application'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MentorRegistration; 