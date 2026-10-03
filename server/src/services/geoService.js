/**
 * Geo Service - Spatial distance calculations, PostGIS query simulations,
 * duplicate detection, and heatmap generation.
 */

// Calculate Haversine distance in meters between two coordinates
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // distance in meters
}

/**
 * PostGIS ST_DWithin simulation:
 * SELECT * FROM issues WHERE ST_DWithin(geom, ST_MakePoint(lng, lat)::geography, radiusMeters);
 */
export function findNearbyIssues(issues, targetLat, targetLng, radiusMeters = 500) {
  return issues
    .map(issue => {
      const distance = calculateDistanceMeters(targetLat, targetLng, issue.latitude, issue.longitude);
      return { ...issue, distanceMeters: distance };
    })
    .filter(issue => issue.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Duplicate Detection Engine:
 * Finds active (open or in_progress) issues within a 50m radius of the same category
 */
export function detectDuplicates(issues, targetLat, targetLng, category, thresholdMeters = 75) {
  const activeIssues = issues.filter(i => i.status !== 'resolved' && i.status !== 'rejected');
  
  const matches = activeIssues
    .map(issue => {
      const distance = calculateDistanceMeters(targetLat, targetLng, issue.latitude, issue.longitude);
      const isSameCategory = issue.category.toLowerCase() === category.toLowerCase();
      return {
        ...issue,
        distanceMeters: distance,
        isSameCategory,
        confidence: isSameCategory 
          ? Math.max(0, Math.round(100 - (distance / thresholdMeters) * 40))
          : Math.max(0, Math.round(60 - (distance / thresholdMeters) * 40))
      };
    })
    .filter(item => item.distanceMeters <= thresholdMeters);

  return {
    hasPotentialDuplicates: matches.length > 0,
    count: matches.length,
    candidates: matches
  };
}

/**
 * Generate Heatmap Intensity Points for spatial visualization
 */
export function generateHeatmapData(issues) {
  return issues.map(issue => {
    // Weight based on severity and active status
    let intensity = 0.5;
    if (issue.priority === 'critical') intensity = 1.0;
    else if (issue.priority === 'high') intensity = 0.8;
    else if (issue.priority === 'medium') intensity = 0.6;
    
    if (issue.status === 'resolved') intensity *= 0.3; // faded

    return [issue.latitude, issue.longitude, intensity];
  });
}
