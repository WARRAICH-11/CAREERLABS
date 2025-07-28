import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaLaptopCode, FaChartLine, FaUsers, FaBuilding, FaHandshake, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>CAREER LABS</h1>
          <p className="hero-description">
            Your gateway to career success. Discover opportunities, connect with mentors, and build your professional future.
          </p>
          
          <div className="hero-cta">
            {isAuthenticated ? (
              <Link to="/dashboard" className="primary-button">
                Go to Dashboard
              </Link>
            ) : (
              <div className="hero-buttons">
                <Link to="/login" className="primary-button">
                  Login
                </Link>
                <Link to="/register" className="secondary-button">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="section features-section">
        <div className="section-header">
          <h2>Our Features</h2>
          <p>Comprehensive tools to accelerate your career journey</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <FaGraduationCap className="feature-icon" />
            <h3>Career Assessment</h3>
            <p>Discover your strengths and ideal career paths with our comprehensive assessment tools.</p>
          </div>
          
          <div className="feature-card">
            <FaLaptopCode className="feature-icon" />
            <h3>Skills Development</h3>
            <p>Access resources and courses to develop in-demand skills for your target industries.</p>
          </div>
          
          <div className="feature-card">
            <FaChartLine className="feature-icon" />
            <h3>Progress Tracking</h3>
            <p>Monitor your growth and achievements with personalized dashboards and analytics.</p>
          </div>
          
          <div className="feature-card">
            <FaUsers className="feature-icon" />
            <h3>Mentorship</h3>
            <p>Connect with industry professionals for guidance and career advice.</p>
          </div>
          
          <div className="feature-card">
            <FaBuilding className="feature-icon" />
            <h3>Job Opportunities</h3>
            <p>Explore curated job listings aligned with your skills and career goals.</p>
          </div>
          
          <div className="feature-card">
            <FaHandshake className="feature-icon" />
            <h3>Networking</h3>
            <p>Build professional connections to expand your opportunities and industry insights.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section about-section">
        <div className="section-header">
          <h2>About CAREER LABS</h2>
          <p>Empowering professionals to reach their full potential</p>
        </div>
        
        <div className="about-content">
          <div className="about-text">
            <p>
              Founded in 2023, CAREER LABS is dedicated to bridging the gap between education and employment. We provide a comprehensive platform that empowers individuals to build successful careers through assessment, guidance, and opportunities.
            </p>
            <p>
              Our team of industry experts and career specialists work tirelessly to ensure that our users have access to the most relevant resources, mentorship, and job opportunities. We believe that everyone deserves a fulfilling career, and our mission is to make that possible.
            </p>
            <p>
              Whether you're just starting your professional journey, looking to pivot to a new industry, or aiming to advance in your current field, CAREER LABS provides the tools and support you need to succeed.
            </p>
          </div>
          <div className="about-stats">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Mentors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2,000+</div>
              <div className="stat-label">Job Placements</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section testimonials-section">
        <div className="section-header">
          <h2>Success Stories</h2>
          <p>Hear from our community members</p>
        </div>
        
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"CAREER LABS helped me identify my strengths and find a job that perfectly matches my skills. The mentorship program was particularly valuable in helping me prepare for interviews."</p>
            </div>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/women/32.jpg" alt="Sarah Johnson" className="author-image" />
              <div className="author-info">
                <div className="author-name">Sarah Johnson</div>
                <div className="author-role">Software Engineer at TechCorp</div>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"After using the career assessment tools, I gained clarity about my professional path. The resources and job listings helped me secure a position that aligns with my career goals."</p>
            </div>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="Michael Chen" className="author-image" />
              <div className="author-info">
                <div className="author-name">Michael Chen</div>
                <div className="author-role">Marketing Director at BrandGrowth</div>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"The networking opportunities at CAREER LABS were game-changing for me. I connected with professionals in my field who provided insights that helped me advance in my career."</p>
            </div>
            <div className="testimonial-author">
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Elena Rodriguez" className="author-image" />
              <div className="author-info">
                <div className="author-name">Elena Rodriguez</div>
                <div className="author-role">Financial Analyst at GlobalFinance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section contact-section">
        <div className="section-header">
          <h2>Get in Touch</h2>
          <p>Have questions? We're here to help</p>
        </div>
        
        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <div>
                <h4>Email</h4>
                <p>support@careerlabs.com</p>
              </div>
            </div>
            
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <div>
                <h4>Phone</h4>
                <p>+1 (555) 123-4567</p>
              </div>
            </div>
            
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <div>
                <h4>Address</h4>
                <p>123 Innovation Drive, Tech Park<br />San Francisco, CA 94105</p>
              </div>
            </div>
          </div>
          
          <div className="contact-form-container">
            <form className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" placeholder="Your name" />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="Your email" />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" rows="4" placeholder="Your message"></textarea>
              </div>
              
              <button type="submit" className="primary-button">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">CAREER LABS</div>
          <div className="footer-tagline">Your gateway to career success</div>
          <div className="footer-copyright">© 2023 CAREER LABS. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 