import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, departments } from '../db/store.js';
import { authenticateToken, requireAdmin } from './authRoutes.js';
import { findNearbyIssues, detectDuplicates, generateHeatmapData } from '../services/geoService.js';

const router = express.Router();

// Setup Multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Category definition helper
const categoriesList = [
  { id: 'pothole', label: 'Pothole & Road Damage', icon: 'Hammer', color: '#f59e0b', deptId: 'roads' },
  { id: 'streetlight', label: 'Streetlight & Power', icon: 'Zap', color: '#eab308', deptId: 'electricity' },
  { id: 'garbage', label: 'Garbage & Waste Block', icon: 'Trash2', color: '#10b981', deptId: 'sanitation' },
  { id: 'water_leak', label: 'Water Leak & Flooding', icon: 'Droplets', color: '#06b6d4', deptId: 'water' },
  { id: 'traffic_hazard', label: 'Traffic & Road Hazard', icon: 'Car', color: '#ec4899', deptId: 'traffic' },
  { id: 'tree_fallen', label: 'Parks & Fallen Trees', icon: 'Trees', color: '#84cc16', deptId: 'parks' },
  { id: 'other', label: 'Other Civic Issue', icon: 'AlertTriangle', color: '#6366f1', deptId: 'roads' }
];

// GET /api/issues/categories
router.get('/meta/categories', (req, res) => {
  res.json(categoriesList);
});

// GET /api/issues/departments
router.get('/meta/departments', (req, res) => {
  res.json(departments);
});

// GET /api/issues/heatmap
router.get('/heatmap', (req, res) => {
  const issues = db.getIssues();
  const heatmapData = generateHeatmapData(issues);
  res.json(heatmapData);
});

// GET /api/issues/check-duplicates
router.get('/check-duplicates', (req, res) => {
  const { lat, lng, category } = req.query;
  if (!lat || !lng || !category) {
    return res.status(400).json({ error: 'lat, lng, and category are required.' });
  }

  const issues = db.getIssues();
  const result = detectDuplicates(issues, parseFloat(lat), parseFloat(lng), category, 100);
  res.json(result);
});

// GET /api/issues/nearby (Spatial query simulation)
router.get('/nearby', (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters are required.' });
  }

  const issues = db.getIssues();
  const radiusMeters = radius ? parseFloat(radius) : 500;
  const nearby = findNearbyIssues(issues, parseFloat(lat), parseFloat(lng), radiusMeters);

  res.json({
    center: { lat: parseFloat(lat), lng: parseFloat(lng) },
    radiusMeters,
    count: nearby.length,
    issues: nearby
  });
});

// GET /api/issues - Filtered issue list
router.get('/', (req, res) => {
  let issues = [...db.getIssues()];
  const { category, status, departmentId, search, priority, reporterId, sortBy } = req.query;

  if (category && category !== 'all') {
    issues = issues.filter(i => i.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status !== 'all') {
    issues = issues.filter(i => i.status === status);
  }

  if (departmentId && departmentId !== 'all') {
    issues = issues.filter(i => i.departmentId === departmentId);
  }

  if (priority && priority !== 'all') {
    issues = issues.filter(i => i.priority === priority);
  }

  if (reporterId) {
    issues = issues.filter(i => i.reporter?.id === reporterId);
  }

  if (search) {
    const q = search.toLowerCase();
    issues = issues.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.address.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  }

  if (sortBy === 'upvotes') {
    issues.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  } else if (sortBy === 'oldest') {
    issues.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    // default: newest first
    issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json(issues);
});

// GET /api/issues/:id
router.get('/:id', (req, res) => {
  const issue = db.findIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }
  res.json(issue);
});

// POST /api/issues - Create new issue
router.post('/', authenticateToken, upload.single('photo'), (req, res) => {
  try {
    const { title, category, description, priority, latitude, longitude, address, photoUrl } = req.body;

    if (!title || !category || !latitude || !longitude) {
      return res.status(400).json({ error: 'Title, category, latitude, and longitude are required.' });
    }

    let finalPhotoUrl = photoUrl;
    if (req.file) {
      finalPhotoUrl = `/uploads/${req.file.filename}`;
    }

    // Default category matching
    const catObj = categoriesList.find(c => c.id === category) || categoriesList[0];

    const newIssue = db.createIssue(
      {
        title,
        category,
        categoryLabel: catObj.label,
        description: description || '',
        priority: priority || 'medium',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || 'Downtown Metro Area',
        photoUrl: finalPhotoUrl
      },
      req.user
    );

    // Real-time broadcast via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('issue:created', newIssue);
      io.emit('notification:broadcast', {
        title: 'New Issue Reported',
        message: `${req.user.name} reported: "${newIssue.title}"`,
        issueId: newIssue.id,
        category: newIssue.category
      });
    }

    res.status(201).json(newIssue);
  } catch (err) {
    console.error('Error creating issue:', err);
    res.status(500).json({ error: 'Failed to create issue report.' });
  }
});

// PATCH /api/issues/:id/status - Update status & triage (supports resolution photo upload or URL)
router.patch('/:id/status', authenticateToken, requireAdmin, upload.single('resolvedPhoto'), (req, res) => {
  try {
    const { status, departmentId, assignedTo, note } = req.body;
    let { resolvedPhotoUrl } = req.body;
    
    // If a physical photo file was uploaded via multipart/form-data
    if (req.file) {
      resolvedPhotoUrl = `/uploads/${req.file.filename}`;
    }

    const issueId = req.params.id;

    const result = db.updateIssueStatus(issueId, {
      status,
      departmentId,
      assignedTo,
      note,
      adminUser: req.user,
      resolvedPhotoUrl
    });

    if (!result) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const { issue, newTimelineEntry } = result;

    // Real-time broadcast via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('issue:status_updated', {
        issueId: issue.id,
        status: issue.status,
        departmentId: issue.departmentId,
        departmentName: issue.departmentName,
        assignedTo: issue.assignedTo,
        resolvedPhotoUrl: issue.resolvedPhotoUrl,
        timelineEntry: newTimelineEntry,
        updatedIssue: issue
      });

      // Target citizen specific alert
      if (issue.reporter?.id) {
        io.to(`user_${issue.reporter.id}`).emit('notification:personal', {
          issueId: issue.id,
          title: `Status update: ${issue.title.substring(0, 30)}...`,
          message: note || `Your report status is now "${issue.status.replace('_', ' ').toUpperCase()}"`,
          status: issue.status,
          resolvedPhotoUrl: issue.resolvedPhotoUrl
        });
      }
    }

    res.json({
      message: 'Issue status updated successfully',
      issue,
      timelineEntry: newTimelineEntry
    });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update issue status.' });
  }
});

// POST /api/issues/:id/feedback - Submit citizen feedback on resolved issue
router.post('/:id/feedback', authenticateToken, (req, res) => {
  try {
    const issueId = req.params.id;
    const { rating, comment, tags, satisfaction } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'Rating (1-5 stars) is required.' });
    }

    const existingIssue = db.findIssueById(issueId);
    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    if (existingIssue.status !== 'resolved') {
      return res.status(400).json({ error: 'Feedback can only be submitted for resolved complaints.' });
    }

    const result = db.addIssueFeedback(
      issueId,
      { rating, comment, tags, satisfaction },
      req.user
    );

    if (!result) {
      return res.status(500).json({ error: 'Failed to record feedback.' });
    }

    const { issue, newFeedback, feedbackTimeline } = result;

    // Broadcast feedback event in real-time via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('issue:feedback_submitted', {
        issueId: issue.id,
        feedback: newFeedback,
        feedbackTimeline,
        updatedIssue: issue
      });
      io.emit('notification:broadcast', {
        title: 'Citizen Feedback Received',
        message: `${req.user.name} rated #${issue.id}: ${'⭐'.repeat(newFeedback.rating)}`,
        issueId: issue.id
      });
    }

    res.status(201).json({
      message: 'Feedback submitted successfully. Thank you for your review!',
      feedback: newFeedback,
      issue
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Failed to submit citizen feedback.' });
  }
});

// POST /api/issues/:id/upvote - Upvote issue
router.post('/:id/upvote', authenticateToken, (req, res) => {
  const issueId = req.params.id;
  const result = db.toggleUpvote(issueId, req.user.id);

  if (!result) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  const { issue, hasUpvoted } = result;

  // Broadcast upvote
  const io = req.app.get('io');
  if (io) {
    io.emit('issue:upvoted', {
      issueId: issue.id,
      upvotes: issue.upvotes,
      userId: req.user.id
    });
  }

  res.json({
    issueId: issue.id,
    upvotes: issue.upvotes,
    hasUpvoted
  });
});

// GET /api/issues/notifications/me
router.get('/user/notifications', authenticateToken, (req, res) => {
  const notifs = db.getNotifications(req.user.id);
  res.json(notifs);
});

// PATCH /api/issues/notifications/:id/read
router.patch('/user/notifications/:id/read', authenticateToken, (req, res) => {
  const notif = db.markNotificationRead(req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  res.json(notif);
});

export default router;
