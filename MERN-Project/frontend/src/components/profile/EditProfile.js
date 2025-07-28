import React, { useContext, useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import './Profile.css';

// Validation schema
const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot be more than 50 characters'),
  bio: Yup.string()
    .max(500, 'Bio cannot be more than 500 characters'),
  phone: Yup.string()
    .max(20, 'Phone number cannot be more than 20 characters'),
  location: Yup.string()
    .max(100, 'Location cannot be more than 100 characters'),
  skills: Yup.array()
    .of(Yup.string()),
  interests: Yup.array()
    .of(Yup.string()),
  social: Yup.object().shape({
    linkedin: Yup.string().url('Please enter a valid URL'),
    twitter: Yup.string().url('Please enter a valid URL'),
    github: Yup.string().url('Please enter a valid URL'),
    website: Yup.string().url('Please enter a valid URL')
  })
});

const EditProfile = () => {
  const { currentUser, updateProfile, error, setError } = useContext(AuthContext);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  // Clear any previous errors when component mounts
  useEffect(() => {
    setError(null);
  }, [setError]);

  // Prepare initial form values
  const initialValues = {
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    phone: currentUser?.phone || '',
    location: currentUser?.location || '',
    skills: currentUser?.skills || [],
    interests: currentUser?.interests || [],
    social: {
      linkedin: currentUser?.social?.linkedin || '',
      twitter: currentUser?.social?.twitter || '',
      github: currentUser?.social?.github || '',
      website: currentUser?.social?.website || ''
    }
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    const success = await updateProfile(values);
    setUpdateSuccess(success);
    setSubmitting(false);
    
    if (success) {
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Edit Profile</h1>
        <Link to="/profile" className="back-button">
          Back to Profile
        </Link>
      </div>

      {error && <div className="profile-error">{error}</div>}
      {updateSuccess && (
        <div className="profile-success">Profile updated successfully! Redirecting...</div>
      )}

      <div className="profile-card">
        <Formik
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values }) => (
            <Form className="profile-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <Field 
                    type="text" 
                    name="name" 
                    id="name" 
                    className="form-control" 
                  />
                  <ErrorMessage 
                    name="name" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <Field 
                    as="textarea" 
                    name="bio" 
                    id="bio" 
                    className="form-control" 
                    rows="4"
                  />
                  <ErrorMessage 
                    name="bio" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <Field 
                    type="text" 
                    name="phone" 
                    id="phone" 
                    className="form-control" 
                  />
                  <ErrorMessage 
                    name="phone" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <Field 
                    type="text" 
                    name="location" 
                    id="location" 
                    className="form-control" 
                  />
                  <ErrorMessage 
                    name="location" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Skills & Interests</h3>
                
                <div className="form-group">
                  <label>Skills</label>
                  <FieldArray name="skills">
                    {({ remove, push }) => (
                      <div>
                        {values.skills.map((skill, index) => (
                          <div key={index} className="tag-item">
                            <Field 
                              name={`skills.${index}`} 
                              type="text" 
                              className="form-control tag-input" 
                            />
                            <button
                              type="button"
                              className="tag-remove"
                              onClick={() => remove(index)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="tag-add"
                          onClick={() => push('')}
                        >
                          Add Skill
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
                
                <div className="form-group">
                  <label>Interests</label>
                  <FieldArray name="interests">
                    {({ remove, push }) => (
                      <div>
                        {values.interests.map((interest, index) => (
                          <div key={index} className="tag-item">
                            <Field 
                              name={`interests.${index}`} 
                              type="text" 
                              className="form-control tag-input" 
                            />
                            <button
                              type="button"
                              className="tag-remove"
                              onClick={() => remove(index)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="tag-add"
                          onClick={() => push('')}
                        >
                          Add Interest
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
              </div>
              
              <div className="form-section">
                <h3>Social Media</h3>
                
                <div className="form-group">
                  <label htmlFor="social.linkedin">LinkedIn</label>
                  <Field 
                    type="text" 
                    name="social.linkedin" 
                    id="social.linkedin" 
                    className="form-control" 
                    placeholder="https://linkedin.com/in/username"
                  />
                  <ErrorMessage 
                    name="social.linkedin" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="social.twitter">Twitter</label>
                  <Field 
                    type="text" 
                    name="social.twitter" 
                    id="social.twitter" 
                    className="form-control" 
                    placeholder="https://twitter.com/username"
                  />
                  <ErrorMessage 
                    name="social.twitter" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="social.github">GitHub</label>
                  <Field 
                    type="text" 
                    name="social.github" 
                    id="social.github" 
                    className="form-control" 
                    placeholder="https://github.com/username"
                  />
                  <ErrorMessage 
                    name="social.github" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="social.website">Personal Website</label>
                  <Field 
                    type="text" 
                    name="social.website" 
                    id="social.website" 
                    className="form-control" 
                    placeholder="https://yourwebsite.com"
                  />
                  <ErrorMessage 
                    name="social.website" 
                    component="div" 
                    className="form-error" 
                  />
                </div>
              </div>
              
              <div className="form-action">
                <button 
                  type="submit" 
                  className="profile-button" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditProfile; 