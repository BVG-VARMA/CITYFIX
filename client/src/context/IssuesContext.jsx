import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { getIpLocation } from '../utils/geoUtils';

const IssuesContext = createContext(null);

export function IssuesProvider({ children }) {
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // User map center and geolocation default
  const [userLocation, setUserLocation] = useState({
    lat: 17.3850,
    lng: 78.4867, // Default regional center if unlocated
    hasLocation: false,
    source: 'default'
  });

  // Filter state
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    departmentId: 'all',
    priority: 'all',
    search: '',
    radius: 'all', // 'all' or number in meters (e.g. 500, 1000)
    sortBy: 'newest'
  });

  const { socket, playSoundAlert, showToast } = useSocket();
  const { user, addNotification } = useAuth();

  // Fetch initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [issuesData, catsData, deptsData, heatmap] = await Promise.all([
        api.getIssues(),
        api.getCategories(),
        api.getDepartments(),
        api.getHeatmap()
      ]);
      setIssues(issuesData);
      setCategories(catsData);
      setDepartments(deptsData);
      setHeatmapData(heatmap);
    } catch (err) {
      console.error('Error loading civic issue data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Comprehensive GPS (High Accuracy -> Standard Accuracy) & IP Geolocation Detection
  const detectLocation = useCallback(async () => {
    return new Promise((resolve) => {
      const applyGps = (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
        console.log(`📍 GPS Location successfully resolved: [${lat}, ${lng}] (Accuracy: ±${accuracy}m)`);
        const loc = {
          lat,
          lng,
          accuracy,
          hasLocation: true,
          source: 'gps'
        };
        setUserLocation(loc);
        resolve(loc);
      };

      const fallbackToIp = async () => {
        try {
          console.log('🌐 Attempting IP-based location fallback...');
          const ipLoc = await getIpLocation();
          if (ipLoc && ipLoc.lat && ipLoc.lng) {
            console.log(`📍 IP Location resolved: ${ipLoc.city}, ${ipLoc.country} [${ipLoc.lat}, ${ipLoc.lng}]`);
            const loc = {
              lat: ipLoc.lat,
              lng: ipLoc.lng,
              city: ipLoc.city,
              country: ipLoc.country,
              hasLocation: true,
              source: 'ip'
            };
            setUserLocation(loc);
            resolve(loc);
            return;
          }
        } catch (err) {
          console.warn('IP location detection error:', err);
        }
        resolve(null);
      };

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        // Try high accuracy first (e.g. mobile GPS / hardware GPS)
        navigator.geolocation.getCurrentPosition(
          applyGps,
          (errHigh) => {
            console.warn('High accuracy GPS timed out or unavailable, trying standard Wi-Fi/network accuracy...', errHigh.message);
            // Fallback immediately to standard accuracy (Windows Location / Wi-Fi network)
            navigator.geolocation.getCurrentPosition(
              applyGps,
              async (errLow) => {
                console.warn('Standard GPS failed or denied, falling back to IP geolocation...', errLow.message);
                await fallbackToIp();
              },
              { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
            );
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        fallbackToIp();
      }
    });
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Listen for real-time Socket.io events
  useEffect(() => {
    if (!socket) return;

    const handleIssueCreated = (newIssue) => {
      console.log('⚡ Real-time Socket Event: [issue:created]', newIssue);
      setIssues((prev) => [newIssue, ...prev.filter(i => i.id !== newIssue.id)]);
      playSoundAlert('new_issue');

      showToast({
        id: `toast-${Date.now()}`,
        type: 'new_issue',
        title: 'New Issue Pin Dropped 📍',
        message: `${newIssue.title} (${newIssue.categoryLabel})`,
        issueId: newIssue.id,
        photoUrl: newIssue.photoUrl
      });
    };

    const handleStatusUpdated = ({ issueId, status, departmentId, departmentName, assignedTo, timelineEntry, updatedIssue }) => {
      console.log('⚡ Real-time Socket Event: [issue:status_updated]', issueId, status);
      setIssues((prev) =>
        prev.map((item) => {
          if (item.id === issueId) {
            return {
              ...item,
              ...updatedIssue,
              status,
              departmentId: departmentId || item.departmentId,
              departmentName: departmentName || item.departmentName,
              assignedTo: assignedTo !== undefined ? assignedTo : item.assignedTo,
              timeline: item.timeline ? [...item.timeline, timelineEntry] : [timelineEntry]
            };
          }
          return item;
        })
      );

      // If currently viewing modal, update active view in-place
      setSelectedIssue((curr) => {
        if (curr && curr.id === issueId) {
          return {
            ...curr,
            ...updatedIssue,
            status,
            departmentId: departmentId || curr.departmentId,
            departmentName: departmentName || curr.departmentName,
            assignedTo: assignedTo !== undefined ? assignedTo : curr.assignedTo,
            timeline: curr.timeline ? [...curr.timeline, timelineEntry] : [timelineEntry]
          };
        }
        return curr;
      });

      playSoundAlert('status_updated');

      showToast({
        id: `toast-${Date.now()}`,
        type: 'status_updated',
        title: `Issue #${issueId} Status Updated`,
        message: `Status moved to "${status.replace('_', ' ').toUpperCase()}"`,
        issueId
      });
    };

    const handleUpvoted = ({ issueId, upvotes }) => {
      setIssues((prev) =>
        prev.map((item) => (item.id === issueId ? { ...item, upvotes } : item))
      );
      setSelectedIssue((curr) => (curr && curr.id === issueId ? { ...curr, upvotes } : curr));
    };

    const handleFeedbackSubmitted = ({ issueId, feedback, feedbackTimeline, updatedIssue }) => {
      console.log('⚡ Real-time Socket Event: [issue:feedback_submitted]', issueId, feedback);
      setIssues((prev) =>
        prev.map((item) => {
          if (item.id === issueId) {
            const currentFeedbacks = item.feedback || [];
            return {
              ...item,
              ...updatedIssue,
              feedback: [feedback, ...currentFeedbacks.filter(f => f.id !== feedback.id)],
              timeline: item.timeline ? [...item.timeline, feedbackTimeline] : [feedbackTimeline]
            };
          }
          return item;
        })
      );

      setSelectedIssue((curr) => {
        if (curr && curr.id === issueId) {
          const currentFeedbacks = curr.feedback || [];
          return {
            ...curr,
            ...updatedIssue,
            feedback: [feedback, ...currentFeedbacks.filter(f => f.id !== feedback.id)],
            timeline: curr.timeline ? [...curr.timeline, feedbackTimeline] : [feedbackTimeline]
          };
        }
        return curr;
      });

      playSoundAlert('status_updated');

      showToast({
        id: `toast-${Date.now()}`,
        type: 'feedback_received',
        title: `Citizen Review on #${issueId}`,
        message: `${'⭐'.repeat(feedback.rating)} - "${feedback.comment || 'Civic rating submitted'}"`,
        issueId
      });
    };

    const handlePersonalNotification = (notif) => {
      addNotification({
        id: `notif-${Date.now()}`,
        ...notif,
        read: false,
        createdAt: new Date().toISOString()
      });
      playSoundAlert('status_updated');
    };

    socket.on('issue:created', handleIssueCreated);
    socket.on('issue:status_updated', handleStatusUpdated);
    socket.on('issue:upvoted', handleUpvoted);
    socket.on('issue:feedback_submitted', handleFeedbackSubmitted);
    socket.on('notification:personal', handlePersonalNotification);

    return () => {
      socket.off('issue:created', handleIssueCreated);
      socket.off('issue:status_updated', handleStatusUpdated);
      socket.off('issue:upvoted', handleUpvoted);
      socket.off('issue:feedback_submitted', handleFeedbackSubmitted);
      socket.off('notification:personal', handlePersonalNotification);
    };
  }, [socket, playSoundAlert, showToast, addNotification]);

  // Actions
  const createIssue = async (formData) => {
    const res = await api.createIssue(formData);
    return res;
  };

  const updateStatus = async (issueId, updateData) => {
    const res = await api.updateIssueStatus(issueId, updateData);
    return res;
  };

  const submitFeedback = async (issueId, feedbackData) => {
    const res = await api.submitIssueFeedback(issueId, feedbackData);
    return res;
  };

  const upvoteIssue = async (issueId) => {
    const res = await api.toggleUpvote(issueId);
    return res;
  };

  // Distance helper (Haversine in meters)
  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Filtered issues computation
  const filteredIssues = issues.filter((issue) => {
    if (filters.category !== 'all' && issue.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    if (filters.status !== 'all' && issue.status !== filters.status) {
      return false;
    }
    if (filters.departmentId !== 'all' && issue.departmentId !== filters.departmentId) {
      return false;
    }
    if (filters.priority !== 'all' && issue.priority !== filters.priority) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        issue.title?.toLowerCase().includes(q) ||
        issue.description?.toLowerCase().includes(q) ||
        issue.address?.toLowerCase().includes(q) ||
        issue.id?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.radius !== 'all') {
      const radiusM = parseFloat(filters.radius);
      const dist = getDistanceMeters(userLocation.lat, userLocation.lng, issue.latitude, issue.longitude);
      if (dist > radiusM) return false;
    }
    return true;
  });

  return (
    <IssuesContext.Provider
      value={{
        issues,
        filteredIssues,
        categories,
        departments,
        heatmapData,
        loading,
        selectedIssue,
        setSelectedIssue,
        filters,
        setFilters,
        userLocation,
        setUserLocation,
        detectLocation,
        createIssue,
        updateStatus,
        submitFeedback,
        upvoteIssue,
        refreshIssues: loadInitialData,
        getDistanceMeters
      }}
    >
      {children}
    </IssuesContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) throw new Error('useIssues must be used within IssuesProvider');
  return context;
}
