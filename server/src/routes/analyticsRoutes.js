import express from 'express';
import { db, departments } from '../db/store.js';

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  const issues = db.getIssues();
  const total = issues.length;
  const open = issues.filter(i => i.status === 'open').length;
  const inProgress = issues.filter(i => i.status === 'in_progress').length;
  const resolved = issues.filter(i => i.status === 'resolved').length;
  const rejected = issues.filter(i => i.status === 'rejected').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const totalUpvotes = issues.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);

  // Category breakdown
  const categoryCounts = {};
  issues.forEach(i => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });

  const categoryBreakdown = Object.keys(categoryCounts).map(cat => ({
    category: cat,
    count: categoryCounts[cat],
    percentage: total > 0 ? Math.round((categoryCounts[cat] / total) * 100) : 0
  }));

  // Department workload & resolution
  const deptPerformance = departments.map(d => {
    const deptIssues = issues.filter(i => i.departmentId === d.id);
    const deptResolved = deptIssues.filter(i => i.status === 'resolved').length;
    const deptInProgress = deptIssues.filter(i => i.status === 'in_progress').length;
    const deptOpen = deptIssues.filter(i => i.status === 'open').length;
    const rate = deptIssues.length > 0 ? Math.round((deptResolved / deptIssues.length) * 100) : 100;

    return {
      departmentId: d.id,
      name: d.name,
      code: d.code,
      color: d.color,
      totalAssigned: deptIssues.length,
      open: deptOpen,
      inProgress: deptInProgress,
      resolved: deptResolved,
      resolutionRate: rate,
      avgResolutionHours: d.avgResolutionHours
    };
  });

  // 7-day trend
  const dailyTrends = [
    { day: 'Mon', reported: 12, resolved: 9 },
    { day: 'Tue', reported: 15, resolved: 14 },
    { day: 'Wed', reported: 8, resolved: 10 },
    { day: 'Thu', reported: 18, resolved: 15 },
    { day: 'Fri', reported: 22, resolved: 19 },
    { day: 'Sat', reported: 14, resolved: 12 },
    { day: 'Today', reported: open + inProgress + resolved, resolved: resolved }
  ];

  res.json({
    metrics: {
      total,
      open,
      inProgress,
      resolved,
      rejected,
      resolutionRate,
      avgResolutionHours: 21.4,
      totalUpvotes,
      activeDispatchCrews: 12
    },
    categoryBreakdown,
    departmentPerformance: deptPerformance,
    dailyTrends
  });
});

export default router;
