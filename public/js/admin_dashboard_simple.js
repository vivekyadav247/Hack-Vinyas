// Simple Admin Dashboard - Basic Working Version

// Load data when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Simple Admin Dashboard Loaded");
  console.log("🔍 Current URL:", window.location.href);

  // Debug: Check if elements exist
  console.log("📊 Elements check:");
  console.log("  - teamsContainer:", document.getElementById("teamsContainer"));
  console.log("  - totalTeams:", document.getElementById("totalTeams"));
  console.log("  - searchInput:", document.getElementById("searchInput"));

  // Test API directly
  testAPI();

  loadDashboardData();
});

// Test API connectivity
async function testAPI() {
  console.log("🧪 Testing API connectivity...");

  try {
    // Test stats API
    const statsResponse = await fetch("/api/admin/stats");
    console.log(
      "📊 Stats API response:",
      statsResponse.status,
      statsResponse.ok
    );

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log("📊 Stats data:", statsData);
    } else {
      const errorText = await statsResponse.text();
      console.log("❌ Stats API error:", errorText);
    }

    // Test teams API
    const teamsResponse = await fetch("/api/admin/teams");
    console.log(
      "👥 Teams API response:",
      teamsResponse.status,
      teamsResponse.ok
    );

    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      console.log("👥 Teams data:", teamsData);
    } else {
      const errorText = await teamsResponse.text();
      console.log("❌ Teams API error:", errorText);
    }
  } catch (error) {
    console.error("❌ API test failed:", error);
  }
}
eams = [];

// Basic functions that will work with inline onclick
function testClick() {
  alert("✅ Click is working!");
  console.log("✅ Click test successful");
}

function refreshData() {
  console.log("🔄 Refreshing data...");
  location.reload();
}

function logoutAdmin() {
  if (confirm("Are you sure you want to logout?")) {
    window.location.href = "/admin/logout";
  }
}

function viewTeamDetails(teamId) {
  alert(`📋 Opening details for team: ${teamId}`);
  console.log("👁️ View details for:", teamId);

  // Simple implementation - you can enhance this
  fetch(`/api/admin/team/${teamId}`)
    .then((response) => response.json())
    .then((team) => {
      alert(
        `Team: ${team.teamName}\nLeader: ${team.leaderName}\nEmail: ${team.email}`
      );
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error loading team details");
    });
}

function viewPaymentScreenshot(teamId, teamName) {
  alert(`📸 Opening screenshot for: ${teamName}`);
  console.log("📸 View screenshot for:", teamName);

  // Open in new window
  window.open(`/api/admin/team/${teamId}/screenshot`, "_blank");
}

function viewPPTFile(teamId, teamName) {
  alert(`📄 Opening PPT for: ${teamName}`);
  console.log("📄 View PPT for:", teamName);

  // Download PPT file
  window.open(`/api/admin/team/${teamId}/ppt`, "_blank");
}

// Load data when page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Simple Admin Dashboard Loaded");
  loadDashboardData();
});

async function loadDashboardData() {
  try {
    // Load stats
    const statsResponse = await fetch("/api/admin/stats");
    const stats = await statsResponse.json();

    // Update stats in UI
    if (document.getElementById("totalTeams")) {
      document.getElementById("totalTeams").textContent = stats.totalTeams || 0;
    }
    if (document.getElementById("paidTeams")) {
      document.getElementById("paidTeams").textContent =
        stats.verifiedPayments || 0;
    }
    if (document.getElementById("pendingPPT")) {
      document.getElementById("pendingPPT").textContent = stats.pendingPPT || 0;
    }
    if (document.getElementById("totalRevenue")) {
      const revenue = (stats.verifiedPayments || 0) * 600;
      document.getElementById(
        "totalRevenue"
      ).textContent = `₹${revenue.toLocaleString()}`;
    }

    // Load teams
    const teamsResponse = await fetch("/api/admin/teams");
    const teams = await teamsResponse.json();

    allTeams = teams;
    displayTeams(teams);

    console.log("✅ Dashboard data loaded successfully");
  } catch (error) {
    console.error("❌ Error loading dashboard:", error);
  }
}

function displayTeams(teams) {
  const container = document.getElementById("teamsContainer");
  if (!container) return;

  if (!teams || teams.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <h4>No Teams Found</h4>
        <p>Teams will appear here once registered.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = teams
    .map((team) => createSimpleTeamCard(team))
    .join("");
}

function createSimpleTeamCard(team) {
  const isPaid =
    team.paymentStatus === "paid" || team.paymentStatus === "verified";
  const statusBadge = isPaid
    ? '<span class="badge bg-success">Verified</span>'
    : '<span class="badge bg-warning">Pending</span>';

  return `
    <div class="col-xl-4 col-lg-6 col-md-12 mb-4">
      <div class="card team-card h-100">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0"><i class="fas fa-users me-2"></i>${
            team.teamName || "N/A"
          }</h6>
          ${statusBadge}
        </div>
        <div class="card-body">
          <p><strong>Leader:</strong> ${team.leaderName || "N/A"}</p>
          <p><strong>Email:</strong> ${team.email || "N/A"}</p>
          <p><strong>Problem:</strong> PS-${team.psNumber || "N/A"}</p>
          <p><strong>PPT:</strong> ${
            team.pptSubmitted ? "✅ Submitted" : "❌ Pending"
          }</p>
        </div>
        <div class="card-footer">
          <div class="d-flex gap-2 flex-wrap">
            <button 
              class="btn btn-primary btn-sm" 
              onclick="viewTeamDetails('${team._id}')"
              style="cursor: pointer;">
              <i class="fas fa-eye"></i> Details
            </button>
            
            ${
              team.paymentScreenshot
                ? `
              <button 
                class="btn btn-info btn-sm" 
                onclick="viewPaymentScreenshot('${team._id}', '${team.teamName}')"
                style="cursor: pointer;">
                <i class="fas fa-image"></i> Screenshot
              </button>
            `
                : ""
            }
            
            ${
              team.pptSubmitted
                ? `
              <button 
                class="btn btn-success btn-sm" 
                onclick="viewPPTFile('${team._id}', '${team.teamName}')"
                style="cursor: pointer;">
                <i class="fas fa-file"></i> PPT
              </button>
            `
                : ""
            }
            
            <button 
              class="btn btn-warning btn-sm" 
              onclick="testClick()"
              style="cursor: pointer;">
              <i class="fas fa-test"></i> Test
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
