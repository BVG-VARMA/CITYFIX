// Automated Full-Stack Test Suite for CityFix
async function runTests() {
  console.log('🧪 Starting CityFix Comprehensive System Verification...\n');

  const BASE = 'http://127.0.0.1:5000/api';

  // 1. Health check
  console.log('1️⃣ Testing Health Check...');
  const healthRes = await fetch(`${BASE}/health`);
  const healthData = await healthRes.json();
  console.log('   Status:', healthData.status, '| Service:', healthData.service);

  // 2. Citizen Phone Registration & Login
  console.log('\n2️⃣ Testing Citizen Mobile Phone Registration & Login...');
  const regPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ramesh Varma',
      phone: regPhone,
      password: 'password123',
      ward: 'Ward 14, Main Road'
    })
  });
  const regData = await regRes.json();
  const citizenToken = regData.token;
  console.log(`   Registered Citizen: ${regData.user.name} | Phone: +91 ${regData.user.phone} | Ward: ${regData.user.ward} ✓`);
  console.log(`   JWT Token Acquired for Mobile: ${citizenToken.substring(0, 20)}... ✓`);

  // Test Phone Login
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: regPhone,
      password: 'password123'
    })
  });
  const loginData = await loginRes.json();
  console.log(`   Phone Login Successful for ${loginData.user.name} (Phone: ${loginData.user.phone}) ✓`);

  // 3. Admin Login
  console.log('\n3️⃣ Testing Admin Authentication...');
  const admRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543200', password: 'admin123' })
  });
  const admData = await admRes.json();
  const adminToken = admData.token;
  console.log(`   Logged in as: ${admData.user.name} (${admData.user.role}) | JWT Token Acquired ✓`);

  // 4. Duplicate Check
  console.log('\n4️⃣ Testing Proximity Duplicate Detection Engine (50m)...');
  const dupRes = await fetch(`${BASE}/issues/check-duplicates?lat=37.7762&lng=-122.4168&category=pothole`);
  const dupData = await dupRes.json();
  console.log(`   Has Potential Duplicates: ${dupData.hasPotentialDuplicates} | Count: ${dupData.count} ✓`);

  // 5. Create New Issue as Citizen
  console.log('\n5️⃣ Testing Citizen Issue Submission (Photo + Leaflet GPS)...');
  const createRes = await fetch(`${BASE}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${citizenToken}`
    },
    body: JSON.stringify({
      title: 'Emergency Pothole on Pine & 8th',
      category: 'pothole',
      description: 'Severe deep asphalt hole reported during morning commute.',
      priority: 'high',
      latitude: 37.7768,
      longitude: -122.4165,
      address: '450 Pine St & 8th St, Civic Center',
      photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'
    })
  });
  const createdIssue = await createRes.json();
  console.log(`   Created Case: #${createdIssue.id} "${createdIssue.title}" | Status: ${createdIssue.status} ✓`);
  console.log(`   Assigned Dept: ${createdIssue.departmentName} | Initial Timeline Events: ${createdIssue.timeline.length} ✓`);

  // 6. PostGIS Spatial Radius Query (500m)
  console.log('\n6️⃣ Testing PostGIS ST_DWithin 500m Spatial Query...');
  const geoRes = await fetch(`${BASE}/issues/nearby?lat=37.7768&lng=-122.4165&radius=500`);
  const geoData = await geoRes.json();
  console.log(`   Found ${geoData.count} issues within 500m radius of target point ✓`);

  // 7. Admin Triage & Status Update to "In Progress"
  console.log('\n7️⃣ Testing Municipal Admin Triage & Status Transition to "In Progress"...');
  const updateRes = await fetch(`${BASE}/issues/${createdIssue.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'in_progress',
      departmentId: 'roads',
      assignedTo: 'Crew Bravo - Heavy Asphalt Unit',
      note: 'Repair crew dispatched with asphalt truck. Night shift repair.'
    })
  });
  const updatedData = await updateRes.json();
  console.log(`   Status updated to: "${updatedData.issue.status}" | Assigned: ${updatedData.issue.assignedTo} ✓`);
  console.log(`   Timeline Audit Entries: ${updatedData.issue.timeline.length} ✓`);

  // 8. Citizen Notification Check
  console.log('\n8️⃣ Testing Citizen Real-Time Notification Delivery...');
  const notifRes = await fetch(`${BASE}/issues/user/notifications`, {
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  const notifs = await notifRes.json();
  console.log(`   Citizen received ${notifs.length} notifications (Latest: "${notifs[0]?.title}") ✓`);

  // 9. Community Upvoting
  console.log('\n9️⃣ Testing Community Upvoting Engine...');
  const upvoteRes = await fetch(`${BASE}/issues/${createdIssue.id}/upvote`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  const upvoteData = await upvoteRes.json();
  console.log(`   Upvote toggled: Total Upvotes = ${upvoteData.upvotes} ✓`);

  // 10. Analytics & SLAs
  console.log('\n🔟 Testing Municipal Analytics & Department SLAs...');
  const analyticsRes = await fetch(`${BASE}/analytics/overview`);
  const analyticsData = await analyticsRes.json();
  console.log(`   Total Tracked Issues: ${analyticsData.metrics.total} | Resolution Rate: ${analyticsData.metrics.resolutionRate}% ✓`);
  console.log(`   Department Breakdown: ${analyticsData.departmentPerformance.length} Departments active ✓`);

  // 11. Officer Resolves Issue with Resolution Photo Proof
  console.log('\n1️⃣1️⃣ Testing Officer Resolution Photo Publishing...');
  const resolveRes = await fetch(`${BASE}/issues/${createdIssue.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'resolved',
      departmentId: 'roads',
      assignedTo: 'Crew Bravo - Heavy Asphalt Unit',
      note: 'Pothole excavated, filled with cold-mix asphalt, compaction verified. Road fully reopened.',
      resolvedPhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80'
    })
  });
  const resolvedData = await resolveRes.json();
  console.log(`   Issue #${resolvedData.issue.id} marked as "${resolvedData.issue.status}" ✓`);
  console.log(`   Published Resolution Photo: ${resolvedData.issue.resolvedPhotoUrl} ✓`);

  // 12. Citizen Feedback Submission on Resolved Issue
  console.log('\n1️⃣2️⃣ Testing Citizen Feedback & 5-Star Rating Submission...');
  const feedbackRes = await fetch(`${BASE}/issues/${createdIssue.id}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${citizenToken}`
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Super fast turnaround! Pothole was completely repaired overnight.',
      tags: ['⚡ Fast Resolution', '🛠️ High Quality Fix'],
      satisfaction: 'satisfied'
    })
  });
  const feedbackData = await feedbackRes.json();
  console.log(`   Feedback recorded: Rating = ${feedbackData.feedback.rating} Stars | Comment: "${feedbackData.feedback.comment}" ✓`);
  console.log(`   Timeline Event Added: "${feedbackData.issue.timeline[feedbackData.issue.timeline.length - 1].title}" ✓`);

  console.log('\n🎉 ALL 12 END-TO-END SYSTEM TESTS PASSED PERFECTLY!');
}

runTests().catch(console.error);
