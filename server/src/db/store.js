import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { runQuery, getOne, getAll, initDatabase as initSqlDb } from './database.js';

// In-memory synchronized arrays
export let departments = [];
export let users = [];
export let issues = [];
export let notifications = [];

// Initialize SQLite database and sync into memory cache
export async function initializeStore() {
  await initSqlDb();

  // 1. Load Departments
  const deptRows = await getAll(`SELECT * FROM departments`);
  departments = deptRows.map(d => ({
    id: d.id,
    name: d.name,
    code: d.code,
    icon: d.icon,
    color: d.color,
    head: d.head,
    contact: d.contact,
    categories: JSON.parse(d.categories_json || '[]'),
    avgResolutionHours: d.avg_resolution_hours
  }));

  // 2. Load Users
  const userRows = await getAll(`SELECT * FROM users`);
  users = userRows.map(u => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    password: u.password,
    role: u.role,
    ward: u.ward,
    avatar: (u.avatar && !u.avatar.includes('photo-1535713875002')) 
      ? u.avatar 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Citizen')}&background=06b6d4&color=0f172a&bold=true`,
    reportsCount: u.reports_count || 0,
    upvotesGiven: u.upvotes_given || 0,
    karma: u.karma || 50,
    badge: u.badge || 'Civic Member',
    departmentId: u.department_id,
    createdAt: u.created_at
  }));

  // 3. Load Issues & Relational Data (Timeline, Upvotes, Feedback)
  const issueRows = await getAll(`SELECT * FROM issues ORDER BY created_at DESC`);
  const timelineRows = await getAll(`SELECT * FROM timeline_events ORDER BY time ASC`);
  const upvoteRows = await getAll(`SELECT * FROM upvotes`);
  const feedbackRows = await getAll(`SELECT * FROM citizen_feedback ORDER BY created_at DESC`);

  issues = issueRows.map(i => {
    const issueTimeline = timelineRows.filter(t => t.issue_id === i.id).map(t => ({
      id: t.id,
      time: t.time,
      timeFormatted: t.time_formatted,
      title: t.title,
      description: t.description,
      actor: t.actor,
      status: t.status
    }));

    const issueUpvoters = upvoteRows.filter(u => u.issue_id === i.id).map(u => u.user_id);
    const issueFeedbacks = feedbackRows.filter(f => f.issue_id === i.id).map(f => ({
      id: f.id,
      userId: f.user_id,
      userName: f.user_name,
      userAvatar: f.user_avatar,
      rating: f.rating,
      comment: f.comment,
      tags: JSON.parse(f.tags_json || '[]'),
      satisfaction: f.satisfaction || 'satisfied',
      createdAt: f.created_at
    }));

    return {
      id: i.id,
      title: i.title,
      category: i.category,
      categoryLabel: i.category_label,
      description: i.description,
      status: i.status,
      priority: i.priority,
      latitude: i.latitude,
      longitude: i.longitude,
      address: i.address,
      photoUrl: i.photo_url,
      resolvedPhotoUrl: i.resolved_photo_url,
      reporter: {
        id: i.reporter_id,
        name: i.reporter_name,
        phone: i.reporter_phone,
        ward: i.reporter_ward,
        avatar: i.reporter_avatar
      },
      departmentId: i.department_id,
      departmentName: i.department_name,
      assignedTo: i.assigned_to,
      upvotes: i.upvotes || 1,
      upvotedBy: issueUpvoters.length > 0 ? issueUpvoters : (i.reporter_id ? [i.reporter_id] : []),
      timeline: issueTimeline,
      feedback: issueFeedbacks,
      createdAt: i.created_at,
      updatedAt: i.updated_at
    };
  });

  // 4. Load Notifications
  const notifRows = await getAll(`SELECT * FROM notifications ORDER BY created_at DESC`);
  notifications = notifRows.map(n => ({
    id: n.id,
    userId: n.user_id,
    issueId: n.issue_id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: Boolean(n.read),
    createdAt: n.created_at
  }));

  console.log(`📊 Synchronized in-memory store with persistent SQLite: ${issues.length} issues, ${users.length} users, ${departments.length} departments.`);
}

// Initial immediate sync
initializeStore().catch(err => console.error('Database sync error:', err));

// Helper functions for DB operations with persistent disk storage
export const db = {
  getUsers: () => users,
  findUserById: (id) => users.find(u => u.id === id),
  findUserByIdentifier: (identifier) => {
    if (!identifier) return null;
    const clean = identifier.toString().trim().toLowerCase();
    return users.find(u => 
      (u.phone && u.phone.trim() === clean) || 
      (u.email && u.email.toLowerCase() === clean)
    );
  },
  createUser: (userData) => {
    const newUser = {
      id: `usr_${uuidv4().substring(0, 8)}`,
      name: userData.name,
      phone: userData.phone || '9876543210',
      email: userData.email || null,
      password: userData.password,
      role: 'citizen',
      ward: userData.ward || 'General Ward',
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'Citizen')}&background=06b6d4&color=0f172a&bold=true`,
      reportsCount: 0,
      upvotesGiven: 0,
      karma: 50,
      badge: 'Civic Explorer',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);

    // Persist to SQLite
    runQuery(
      `INSERT INTO users (id, name, phone, email, password, role, ward, avatar, reports_count, upvotes_given, karma, badge, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUser.id,
        newUser.name,
        newUser.phone,
        newUser.email,
        newUser.password,
        newUser.role,
        newUser.ward,
        newUser.avatar,
        newUser.reportsCount,
        newUser.upvotesGiven,
        newUser.karma,
        newUser.badge,
        newUser.createdAt
      ]
    ).catch(e => console.error('Error persisting user to DB:', e));

    return newUser;
  },

  updateUser: (id, updates) => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    const current = users[userIndex];
    const updated = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      email: updates.email !== undefined ? updates.email.trim() : current.email,
      phone: updates.phone !== undefined ? updates.phone.trim() : current.phone,
      ward: updates.ward !== undefined ? updates.ward.trim() : current.ward,
      badge: updates.badge !== undefined ? updates.badge.trim() : current.badge,
      avatar: updates.avatar !== undefined ? updates.avatar : current.avatar
    };

    users[userIndex] = updated;

    // Persist to SQLite
    runQuery(
      `UPDATE users 
       SET name = ?, email = ?, phone = ?, ward = ?, badge = ?, avatar = ?
       WHERE id = ?`,
      [updated.name, updated.email, updated.phone, updated.ward, updated.badge, updated.avatar, id]
    ).catch(e => console.error('Error updating user in SQLite:', e));

    return updated;
  },

  getDepartments: () => departments,
  findDepartmentById: (id) => departments.find(d => d.id === id),

  getIssues: () => issues,
  findIssueById: (id) => issues.find(i => i.id === id),
  
  createIssue: (issueData, reporterUser) => {
    const newId = `CF-2026-${String(issues.length + 1).padStart(3, '0')}`;
    const now = new Date();
    
    // Auto-resolve department from category
    let dept = departments.find(d => d.categories.includes(issueData.category)) || departments[0];

    const tl1 = {
      id: `tl_${uuidv4().substring(0, 6)}`,
      time: now.toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Report Submitted',
      description: `Report submitted by ${reporterUser.name} (${reporterUser.phone || 'Citizen'}) with photo and GPS location.`,
      actor: `${reporterUser.name} (Citizen)`,
      status: 'open'
    };

    const tl2 = {
      id: `tl_${uuidv4().substring(0, 6)}`,
      time: new Date(now.getTime() + 1000).toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'GPS Geotag Verified',
      description: `Location locked at [${parseFloat(issueData.latitude).toFixed(4)}, ${parseFloat(issueData.longitude).toFixed(4)}]. Routed to ${dept.name}.`,
      actor: 'System (Geo-Service)',
      status: 'open'
    };

    const newIssue = {
      id: newId,
      title: issueData.title,
      category: issueData.category || 'pothole',
      categoryLabel: issueData.categoryLabel || 'Civic Issue',
      description: issueData.description || '',
      status: 'open',
      priority: issueData.priority || 'medium',
      latitude: parseFloat(issueData.latitude),
      longitude: parseFloat(issueData.longitude),
      address: issueData.address || 'Geotagged Location',
      photoUrl: issueData.photoUrl || null,
      resolvedPhotoUrl: null,
      reporter: {
        id: reporterUser.id,
        name: reporterUser.name,
        phone: reporterUser.phone || '9876543210',
        ward: reporterUser.ward || 'Ward Central',
        avatar: reporterUser.avatar
      },
      departmentId: dept.id,
      departmentName: dept.name,
      assignedTo: 'Unassigned',
      upvotes: 1,
      upvotedBy: [reporterUser.id],
      timeline: [tl1, tl2],
      feedback: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    issues.unshift(newIssue);
    
    // Update user stats
    const userIndex = users.findIndex(u => u.id === reporterUser.id);
    if (userIndex !== -1) {
      users[userIndex].reportsCount = (users[userIndex].reportsCount || 0) + 1;
      users[userIndex].karma = (users[userIndex].karma || 0) + 20;

      runQuery(
        `UPDATE users SET reports_count = ?, karma = ? WHERE id = ?`,
        [users[userIndex].reportsCount, users[userIndex].karma, reporterUser.id]
      ).catch(e => console.error('Error updating user stats in DB:', e));
    }

    // Persist issue, timeline and upvotes to SQLite
    runQuery(
      `INSERT INTO issues (id, title, category, category_label, description, status, priority, latitude, longitude, address, photo_url, resolved_photo_url, reporter_id, reporter_name, reporter_phone, reporter_ward, reporter_avatar, department_id, department_name, assigned_to, upvotes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newIssue.id,
        newIssue.title,
        newIssue.category,
        newIssue.categoryLabel,
        newIssue.description,
        newIssue.status,
        newIssue.priority,
        newIssue.latitude,
        newIssue.longitude,
        newIssue.address,
        newIssue.photoUrl,
        newIssue.resolvedPhotoUrl,
        reporterUser.id,
        reporterUser.name,
        reporterUser.phone || '9876543210',
        reporterUser.ward || 'Ward Central',
        reporterUser.avatar,
        dept.id,
        dept.name,
        newIssue.assignedTo,
        newIssue.upvotes,
        newIssue.createdAt,
        newIssue.updatedAt
      ]
    ).catch(e => console.error('Error persisting issue to DB:', e));

    runQuery(
      `INSERT INTO timeline_events (id, issue_id, time, time_formatted, title, description, actor, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tl1.id, newIssue.id, tl1.time, tl1.timeFormatted, tl1.title, tl1.description, tl1.actor, tl1.status,
        tl2.id, newIssue.id, tl2.time, tl2.timeFormatted, tl2.title, tl2.description, tl2.actor, tl2.status
      ]
    ).catch(e => console.error('Error persisting timeline events to DB:', e));

    runQuery(
      `INSERT INTO upvotes (issue_id, user_id, created_at) VALUES (?, ?, ?)`,
      [newIssue.id, reporterUser.id, now.toISOString()]
    ).catch(e => console.error('Error persisting upvote to DB:', e));

    return newIssue;
  },

  updateIssueStatus: (issueId, { status, departmentId, assignedTo, note, adminUser, resolvedPhotoUrl }) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return null;

    const prevStatus = issue.status;
    const now = new Date();

    if (status) issue.status = status;
    if (departmentId) {
      const dept = departments.find(d => d.id === departmentId);
      if (dept) {
        issue.departmentId = dept.id;
        issue.departmentName = dept.name;
      }
    }
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;
    if (resolvedPhotoUrl) issue.resolvedPhotoUrl = resolvedPhotoUrl;
    issue.updatedAt = now.toISOString();

    const statusTitles = {
      open: 'Re-opened Issue',
      assigned: `Assigned to ${issue.departmentName}`,
      in_progress: 'Status Changed: In Progress',
      resolved: 'Issue Resolved & Closed 🎉',
      rejected: 'Issue Marked as Duplicate / Rejected'
    };

    const newTimelineEntry = {
      id: `tl_${uuidv4().substring(0, 6)}`,
      time: now.toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: statusTitles[status] || `Status Updated to ${status}`,
      description: note || `Issue transitioned from "${prevStatus}" to "${status}" by municipal admin.`,
      actor: `${adminUser?.name || 'Municipal Admin'} (${adminUser?.role === 'admin' ? 'Admin' : 'Staff'})`,
      status: status
    };

    issue.timeline.push(newTimelineEntry);

    // Persist issue update & timeline to SQLite
    runQuery(
      `UPDATE issues SET status = ?, department_id = ?, department_name = ?, assigned_to = ?, resolved_photo_url = ?, updated_at = ? WHERE id = ?`,
      [issue.status, issue.departmentId, issue.departmentName, issue.assignedTo, issue.resolvedPhotoUrl, issue.updatedAt, issue.id]
    ).catch(e => console.error('Error updating issue in DB:', e));

    runQuery(
      `INSERT INTO timeline_events (id, issue_id, time, time_formatted, title, description, actor, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newTimelineEntry.id, issue.id, newTimelineEntry.time, newTimelineEntry.timeFormatted, newTimelineEntry.title, newTimelineEntry.description, newTimelineEntry.actor, newTimelineEntry.status]
    ).catch(e => console.error('Error inserting timeline in DB:', e));

    // Create notification for original reporter
    if (issue.reporter?.id) {
      const notif = {
        id: `notif_${uuidv4().substring(0, 8)}`,
        userId: issue.reporter.id,
        issueId: issue.id,
        title: `Status Update: ${issue.title.substring(0, 32)}...`,
        message: note || `Your report #${issue.id} has been moved to "${status.replace('_', ' ').toUpperCase()}".`,
        type: status === 'resolved' ? 'resolved' : 'status_change',
        read: false,
        createdAt: now.toISOString()
      };
      notifications.unshift(notif);

      runQuery(
        `INSERT INTO notifications (id, user_id, issue_id, title, message, type, read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [notif.id, notif.userId, notif.issueId, notif.title, notif.message, notif.type, 0, notif.createdAt]
      ).catch(e => console.error('Error saving notification in DB:', e));
    }

    return { issue, newTimelineEntry };
  },

  toggleUpvote: (issueId, userId) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return null;

    if (!issue.upvotedBy) issue.upvotedBy = [];

    const hasUpvoted = issue.upvotedBy.includes(userId);
    if (hasUpvoted) {
      issue.upvotedBy = issue.upvotedBy.filter(id => id !== userId);
      issue.upvotes = Math.max(0, (issue.upvotes || 1) - 1);

      runQuery(`DELETE FROM upvotes WHERE issue_id = ? AND user_id = ?`, [issueId, userId])
        .catch(e => console.error('Error deleting upvote in DB:', e));
    } else {
      issue.upvotedBy.push(userId);
      issue.upvotes = (issue.upvotes || 0) + 1;

      runQuery(`INSERT INTO upvotes (issue_id, user_id, created_at) VALUES (?, ?, ?)`, [issueId, userId, new Date().toISOString()])
        .catch(e => console.error('Error inserting upvote in DB:', e));
    }

    runQuery(`UPDATE issues SET upvotes = ? WHERE id = ?`, [issue.upvotes, issue.id])
      .catch(e => console.error('Error updating issue upvotes in DB:', e));

    return { issue, hasUpvoted: !hasUpvoted };
  },

  addIssueFeedback: (issueId, feedbackData, user) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return null;

    if (!issue.feedback) issue.feedback = [];

    const now = new Date();
    const rating = Math.min(5, Math.max(1, parseInt(feedbackData.rating) || 5));
    const comment = (feedbackData.comment || '').trim();
    const tags = Array.isArray(feedbackData.tags) ? feedbackData.tags : [];
    const satisfaction = feedbackData.satisfaction || (rating >= 4 ? 'satisfied' : rating >= 3 ? 'neutral' : 'unsatisfied');

    const newFeedback = {
      id: `fb_${uuidv4().substring(0, 8)}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating,
      comment,
      tags,
      satisfaction,
      createdAt: now.toISOString()
    };

    issue.feedback.unshift(newFeedback);

    // Add a timeline event acknowledging citizen feedback
    const starString = '⭐'.repeat(rating);
    const feedbackTl = {
      id: `tl_${uuidv4().substring(0, 6)}`,
      time: now.toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `Citizen Review: ${starString} (${rating}/5)`,
      description: comment ? `"${comment}"` : `Citizen rated the resolution quality as ${satisfaction.toUpperCase()}.`,
      actor: `${user.name} (Verified Citizen)`,
      status: 'resolved'
    };
    issue.timeline.push(feedbackTl);

    // Reward citizen karma (+15 karma)
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].karma = (users[userIndex].karma || 0) + 15;
      runQuery(`UPDATE users SET karma = ? WHERE id = ?`, [users[userIndex].karma, user.id])
        .catch(e => console.error('Error updating user karma for feedback:', e));
    }

    // Persist feedback to SQLite
    runQuery(
      `INSERT INTO citizen_feedback (id, issue_id, user_id, user_name, user_avatar, rating, comment, tags_json, satisfaction, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newFeedback.id,
        issue.id,
        newFeedback.userId,
        newFeedback.userName,
        newFeedback.userAvatar,
        newFeedback.rating,
        newFeedback.comment,
        JSON.stringify(newFeedback.tags),
        newFeedback.satisfaction,
        newFeedback.createdAt
      ]
    ).catch(e => console.error('Error saving citizen feedback to DB:', e));

    // Persist timeline event to SQLite
    runQuery(
      `INSERT INTO timeline_events (id, issue_id, time, time_formatted, title, description, actor, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [feedbackTl.id, issue.id, feedbackTl.time, feedbackTl.timeFormatted, feedbackTl.title, feedbackTl.description, feedbackTl.actor, feedbackTl.status]
    ).catch(e => console.error('Error saving feedback timeline event to DB:', e));

    return { issue, newFeedback, feedbackTimeline: feedbackTl };
  },

  getNotifications: (userId) => {
    return notifications.filter(n => n.userId === userId);
  },

  markNotificationRead: (notifId) => {
    const n = notifications.find(notif => notif.id === notifId);
    if (n) {
      n.read = true;
      runQuery(`UPDATE notifications SET read = 1 WHERE id = ?`, [notifId])
        .catch(e => console.error('Error updating notification read in DB:', e));
    }
    return n;
  }
};
