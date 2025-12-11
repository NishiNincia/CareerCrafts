import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import api from "../api/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    recruiters: 0,
    employees: 0,
    total_jobs: 0,
    total_applications: 0,
  });

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Fetch analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        // You'll need to create these admin endpoints in Django
        const [usersRes, jobsRes] = await Promise.all([
          api.get("/accounts/"), // Get all users
          api.get("/jobs/")      // Get all jobs
        ]);
        
        setUsers(usersRes.data || []);
        setJobs(jobsRes.data || []);
        
        // Calculate stats manually until you create admin endpoints
        setStats({
          total_users: usersRes.data?.length || 0,
          recruiters: usersRes.data?.filter(u => u.role === 'recruiter').length || 0,
          employees: usersRes.data?.filter(u => u.role === 'employee').length || 0,
          total_jobs: jobsRes.data?.length || 0,
          total_applications: 0 // You'll need to implement this
        });
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();
  }, []);

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/accounts/users/${userId}/`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      alert("Error deleting user");
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}/`);
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (err) {
      alert("Error deleting job");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Analytics Overview */}
      <Grid container spacing={3} sx={{ marginBottom: 4 }}>
        {/* ... keep the same card structure but use stats.total_users, etc. */}
      </Grid>

      {/* User Management */}
      <Paper sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom>
          Manage Users
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Job Management */}
      <Paper sx={{ padding: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Jobs
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.company}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
//modified according to django