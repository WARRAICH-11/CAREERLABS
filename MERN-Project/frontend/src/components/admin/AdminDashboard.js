import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { FaUsers, FaBriefcase, FaFileAlt, FaUserPlus } from 'react-icons/fa';
import './Admin.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [jobAnalytics, setJobAnalytics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard stats
        const statsResponse = await axios.get('/api/admin/dashboard');
        setStats(statsResponse.data);
        
        // Fetch user analytics
        const userAnalyticsResponse = await axios.get('/api/admin/analytics/users');
        setUserAnalytics(userAnalyticsResponse.data);
        
        // Fetch job analytics
        const jobAnalyticsResponse = await axios.get('/api/admin/analytics/jobs');
        setJobAnalytics(jobAnalyticsResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <Container className="admin-container">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="admin-container">
        <Alert variant="danger" className="my-4">
          {error}
        </Alert>
      </Container>
    );
  }

  // Prepare data for user registration line chart
  const userRegistrationData = {
    labels: userAnalytics?.registrationsOverTime.map(item => item.date) || [],
    datasets: [
      {
        label: 'New Users',
        data: userAnalytics?.registrationsOverTime.map(item => item.count) || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4
      }
    ]
  };

  // Prepare data for jobs by status bar chart
  const jobStatusData = {
    labels: jobAnalytics?.jobsByStatus.map(item => item.status) || [],
    datasets: [
      {
        label: 'Jobs by Status',
        data: jobAnalytics?.jobsByStatus.map(item => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderWidth: 1
      }
    ]
  };

  // Prepare data for user roles pie chart
  const userRolesData = {
    labels: stats?.users.rolesDistribution.map(item => item.role || 'No Role') || [],
    datasets: [
      {
        label: 'User Roles',
        data: stats?.users.rolesDistribution.map(item => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <Container fluid className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of platform metrics and analytics</p>
      </div>

      {/* Stats Cards */}
      <Row className="stats-cards">
        <Col md={3} sm={6}>
          <Card className="stat-card mb-4">
            <Card.Body>
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-content">
                <h3>{stats?.users.total || 0}</h3>
                <p>Total Users</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card mb-4">
            <Card.Body>
              <div className="stat-icon">
                <FaUserPlus />
              </div>
              <div className="stat-content">
                <h3>{stats?.users.newUsers || 0}</h3>
                <p>New Users (30 days)</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card mb-4">
            <Card.Body>
              <div className="stat-icon">
                <FaBriefcase />
              </div>
              <div className="stat-content">
                <h3>{stats?.jobs.total || 0}</h3>
                <p>Total Jobs</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card mb-4">
            <Card.Body>
              <div className="stat-icon">
                <FaFileAlt />
              </div>
              <div className="stat-content">
                <h3>{stats?.files.total || 0}</h3>
                <p>Total Files</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="chart-row">
        <Col lg={6}>
          <Card className="chart-card mb-4">
            <Card.Header>User Registrations (Last 12 Months)</Card.Header>
            <Card.Body>
              {userAnalytics?.registrationsOverTime?.length > 0 ? (
                <Line 
                  data={userRegistrationData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: false
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center py-4">No registration data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="chart-card mb-4">
            <Card.Header>Jobs by Status</Card.Header>
            <Card.Body>
              {jobAnalytics?.jobsByStatus?.length > 0 ? (
                <Bar 
                  data={jobStatusData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      },
                      title: {
                        display: false
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center py-4">No job status data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="chart-row">
        <Col lg={6}>
          <Card className="chart-card mb-4">
            <Card.Header>User Roles Distribution</Card.Header>
            <Card.Body>
              {stats?.users.rolesDistribution?.length > 0 ? (
                <div className="pie-chart-container">
                  <Pie 
                    data={userRolesData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right',
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-4">No user role data available</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="chart-card mb-4">
            <Card.Header>Quick Links</Card.Header>
            <Card.Body>
              <div className="quick-links">
                <Link to="/admin/users" className="admin-link">
                  <FaUsers /> Manage Users
                </Link>
                <Link to="/admin/roles" className="admin-link">
                  <FaUsers /> Manage Roles
                </Link>
                <Link to="/admin/jobs" className="admin-link">
                  <FaBriefcase /> Manage Jobs
                </Link>
                <Link to="/admin/files" className="admin-link">
                  <FaFileAlt /> Manage Files
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard; 