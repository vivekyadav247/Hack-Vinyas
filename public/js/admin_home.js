// ✅ VINYAS ADMIN HOME DASHBOARD - COMPLETE WORKING VERSION
// 🏠 Complete Admin Home Functionality

console.log("🚀 Loading Vinyas Admin Home Dashboard...");

// Global variables for dashboard state
let dashboardData = {
  stats: {},
  teams: [],
  isLoading: false,
};

// 🎯 Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM Ready - Initializing Admin Home...");
  initializeAdminHome();
});

// 🚀 Main initialization function
async function initializeAdminHome() {
  console.log("🔧 Starting Admin Home initialization...");

  try {
    // Show loading state
    showLoadingState();

    // Load dashboard data
    await loadDashboardData();

    // Setup event listeners
    setupEventListeners();

    console.log("✅ Admin Home initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Admin Home:", error);
    showErrorState("Failed to initialize dashboard. Please refresh the page.");
  }
}

// 📊 Load dashboard data from API
async function loadDashboardData() {
  console.log("📡 Loading dashboard data from API...");
  dashboardData.isLoading = true;

  try {
    const response = await fetch("/api/admin/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Dashboard data loaded:", data);

    if (!data.success) {
      throw new Error(data.message || "Invalid response from server");
    }

    // Update global data
    dashboardData.stats = data.stats;
    dashboardData.teams = data.teams;
    dashboardData.isLoading = false;

    // Update UI components
    updateStatistics();
    renderTeamsGrid();

    console.log(`📊 Loaded ${data.teams.length} teams successfully`);
  } catch (error) {
    console.error("❌ Error loading dashboard data:", error);
    dashboardData.isLoading = false;
    showErrorState("Failed to load dashboard data. Please refresh the page.");
  }
}

// 📈 Update statistics display
function updateStatistics() {
  console.log("📈 Updating statistics display...");

  const stats = dashboardData.stats;

  // Update stat numbers
  const elements = {
    "total-teams": stats.totalTeams || 0,
    "total-submissions": stats.totalSubmissions || 0,
    "pending-submissions": stats.pendingSubmissions || 0,
    "total-revenue": `₹${stats.totalRevenue || 0}`,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });

  console.log("✅ Statistics updated successfully");
}

// 👥 Render teams grid
function renderTeamsGrid() {
  console.log("👥 Rendering teams grid...");

  const container = document.getElementById("teams-container");
  const teams = dashboardData.teams;

  if (!container) {
    console.error("❌ Teams container not found");
    return;
  }

  if (!teams || teams.length === 0) {
    container.innerHTML = `
            <div class="loading">
                <i class="fas fa-users"></i>
                <p>No teams registered yet</p>
            </div>
        `;
    return;
  }

  const teamsHTML = teams.map((team) => createTeamCard(team)).join("");
  container.innerHTML = `<div class="teams-grid">${teamsHTML}</div>`;

  console.log(`✅ Rendered ${teams.length} team cards`);
}

// 🎴 Create individual team card with updated structure
function createTeamCard(team) {
  const statusClass = getStatusClass(team.paymentStatus);

  // Create members details HTML
  let membersDetailsHTML = "";
  if (team.members && team.members.length > 0) {
    membersDetailsHTML = team.members
      .map(
        (member, index) => `
      <div class="member-detail-item">
        <div class="member-header">
          <i class="fas fa-user"></i>
          <strong>${index + 1}. ${escapeHtml(member.name || "N/A")}</strong>
          <span class="member-role">(${escapeHtml(
            member.role || "Member"
          )})</span>
        </div>
        <div class="member-info-grid">
          <div class="member-info-item">
            <i class="fas fa-envelope"></i>
            <span>Email: ${escapeHtml(member.email || "N/A")}</span>
          </div>
          <div class="member-info-item">
            <i class="fas fa-id-card"></i>
            <span>Enrollment: ${escapeHtml(member.enrollment || "N/A")}</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } else {
    membersDetailsHTML =
      '<div class="no-members">No member details available</div>';
  }

  return `
        <div class="team-card" data-team-id="${team._id}">
            <div class="team-name">${escapeHtml(team.teamName)}</div>
            
            <div class="team-leader-info">
                <div class="info-item">
                    <i class="fas fa-user-tie"></i>
                    <strong>Team Leader:</strong> ${escapeHtml(
                      team.leaderName || "N/A"
                    )}
                </div>
                <div class="info-item">
                    <i class="fas fa-id-card"></i>
                    <strong>Enrollment No:</strong> ${escapeHtml(
                      team.leaderEnrollment || "N/A"
                    )}
                </div>
                <div class="info-item">
                    <i class="fas fa-envelope"></i>
                    <strong>Leader Email:</strong> ${escapeHtml(
                      team.leadEmail || "N/A"
                    )}
                </div>
                <div class="info-item">
                    <i class="fas fa-receipt"></i>
                    <strong>Transaction ID:</strong> ${escapeHtml(
                      team.transactionId || "N/A"
                    )}
                </div>
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <strong>Members:</strong> ${
                      team.members ? team.members.length : 0
                    }/6
                </div>
            </div>
            
            <!-- Expandable Details Section -->
            <div class="team-details-expanded" id="details-${
              team._id
            }" style="display: none;">
                <div class="expanded-header">
                    <h4><i class="fas fa-info-circle"></i> Complete Team Details</h4>
                </div>
                
                <div class="team-meta-info">
                    <div class="meta-item">
                        <i class="fas fa-university"></i>
                        <strong>College:</strong> ${escapeHtml(
                          team.college || "N/A"
                        )}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <strong>Registration Date:</strong> ${new Date(
                          team.createdAt
                        ).toLocaleDateString("en-IN")}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-credit-card"></i>
                        <strong>Payment Status:</strong> 
                        <span class="payment-status ${statusClass}">${(
    team.paymentStatus || "pending"
  ).toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="all-members-section">
                    <h5><i class="fas fa-users"></i> All Team Members (${
                      team.members ? team.members.length : 0
                    }/6)</h5>
                    <div class="members-details-container">
                        ${membersDetailsHTML}
                    </div>
                </div>
                
                <div class="collapse-section">
                    <button class="collapse-btn" onclick="event.stopPropagation(); toggleTeamDetails('${
                      team._id
                    }')">
                        <i class="fas fa-chevron-up"></i> Collapse Details
                    </button>
                </div>
            </div>
            
            <div class="team-actions">
                <button class="action-btn ppt-btn" onclick="event.stopPropagation(); viewPPT('${
                  team._id
                }')">
                    <i class="fas fa-file-powerpoint"></i> PPT
                </button>
                <button class="action-btn ss-btn" onclick="event.stopPropagation(); viewScreenshot('${
                  team._id
                }')">
                    <i class="fas fa-camera"></i> SS of Payment
                </button>
                <button class="action-btn details-btn" onclick="event.stopPropagation(); toggleTeamDetails('${
                  team._id
                }')">
                    <i class="fas fa-info-circle"></i> <span class="details-btn-text">Full Details</span>
                </button>
                <button class="action-btn mail-btn" onclick="event.stopPropagation(); sendVerificationMail('${
                  team._id
                }', '${escapeHtml(team.teamName)}', '${escapeHtml(
    team.leadEmail || team.leaderEmail
  )}')">
                    <i class="fas fa-envelope"></i> Send Mail
                </button>
                <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteTeam('${
                  team._id
                }', '${escapeHtml(team.teamName)}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            
            <span class="team-status ${statusClass}">
                ${(team.paymentStatus || "pending").toUpperCase()}
            </span>
        </div>
    `;
}

// 📄 View PPT submission - Enhanced with file type detection
async function viewPPT(teamId) {
  try {
    console.log(`📄 Viewing PPT for team: ${teamId}`);

    const team = dashboardData.teams.find((t) => t._id === teamId);
    if (!team) {
      alert("❌ Team not found!");
      return;
    }

    // First, let's get the file info from our test endpoint
    try {
      const testResponse = await fetch(`/api/admin/test-ppt/${teamId}`);
      const fileInfo = await testResponse.json();

      if (fileInfo.success) {
        const fileName = fileInfo.fileName || "Unknown file";
        const fileExt = fileName.split(".").pop()?.toLowerCase();

        console.log(`📄 File info:`, fileInfo);

        // Show file type to user
        const fileTypeMsg =
          fileExt === "pdf"
            ? "PDF Document"
            : fileExt === "ppt"
            ? "PowerPoint Presentation (.ppt)"
            : fileExt === "pptx"
            ? "PowerPoint Presentation (.pptx)"
            : "Document";

        if (
          confirm(
            `📄 Opening ${fileTypeMsg}: ${fileName}\n\nClick OK to download/view the file.`
          )
        ) {
          console.log(`📄 Opening file: ${fileName} (${fileTypeMsg})`);
          window.open(`/api/admin/teams/${teamId}/ppt`, "_blank");
        }
      } else {
        alert(`❌ ${fileInfo.message || "PPT not found for this team"}`);
      }
    } catch (infoError) {
      // Fallback to direct approach if test endpoint fails
      console.log(`📄 Opening PPT URL for team: ${team.teamName}`);
      window.open(`/api/admin/teams/${teamId}/ppt`, "_blank");
    }
  } catch (error) {
    console.error("❌ Error viewing PPT:", error);
    alert("❌ Failed to open PPT.");
  }
}

// 📸 View payment screenshot - Enhanced with better error handling
async function viewScreenshot(teamId) {
  try {
    console.log(`📸 Viewing screenshot for team: ${teamId}`);

    const team = dashboardData.teams.find((t) => t._id === teamId);
    if (!team) {
      alert("❌ Team not found!");
      return;
    }

    // Check if screenshot exists
    const response = await fetch(`/api/admin/teams/${teamId}/screenshot`, {
      method: "HEAD",
    });

    if (response.status === 404) {
      alert(
        `📸 PAYMENT SCREENSHOT\n\nTeam: ${team.teamName}\n\n❌ Payment screenshot does not exist!`
      );
      return;
    }

    if (!response.ok) {
      alert("❌ Error accessing screenshot file!");
      return;
    }

    // Screenshot exists, open it
    window.open(`/api/admin/teams/${teamId}/screenshot`, "_blank");
  } catch (error) {
    console.error("❌ Error viewing screenshot:", error);
    alert("❌ Payment screenshot does not exist or failed to load.");
  }
}

// 📋 Toggle team details expansion
function toggleTeamDetails(teamId) {
  try {
    console.log(`📋 Toggling details for team: ${teamId}`);

    const team = dashboardData.teams.find((t) => t._id === teamId);
    if (!team) {
      alert("❌ Team not found!");
      return;
    }

    const detailsSection = document.getElementById(`details-${teamId}`);
    const detailsBtn = document.querySelector(
      `[data-team-id="${teamId}"] .details-btn`
    );
    const detailsBtnText = document.querySelector(
      `[data-team-id="${teamId}"] .details-btn-text`
    );

    if (!detailsSection) {
      console.error("❌ Details section not found");
      return;
    }

    const isCurrentlyVisible = detailsSection.style.display !== "none";

    if (isCurrentlyVisible) {
      // Collapse the details
      detailsSection.style.display = "none";
      if (detailsBtnText) {
        detailsBtnText.textContent = "Full Details";
      }
      if (detailsBtn) {
        detailsBtn.querySelector("i").className = "fas fa-info-circle";
      }
      console.log("✅ Details collapsed");
    } else {
      // Expand the details
      detailsSection.style.display = "block";
      if (detailsBtnText) {
        detailsBtnText.textContent = "Hide Details";
      }
      if (detailsBtn) {
        detailsBtn.querySelector("i").className = "fas fa-eye-slash";
      }
      console.log("✅ Details expanded");

      // Smooth scroll to show the expanded content
      setTimeout(() => {
        detailsSection.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  } catch (error) {
    console.error("❌ Error toggling team details:", error);
    alert("❌ Failed to load team details.");
  }
}

// 🎨 Get status class for styling
function getStatusClass(status) {
  const statusMap = {
    paid: "status-paid",
    verified: "status-paid",
    pending: "status-pending",
    unpaid: "status-unpaid",
    failed: "status-unpaid",
  };

  return statusMap[status] || "status-pending";
}

// 🛡️ Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 🔧 Setup event listeners
function setupEventListeners() {
  console.log("🎧 Setting up event listeners...");

  // Search functionality
  setupSearchListener();

  // Refresh button
  setupRefreshListener();

  // Export button
  setupExportListener();

  // Logout button
  setupLogoutListener();

  console.log("✅ Event listeners setup complete");
}

// 🔍 Setup search functionality
function setupSearchListener() {
  const searchInput = document.getElementById("searchTeams");
  if (!searchInput) {
    console.warn("⚠️ Search input not found");
    return;
  }

  let searchTimeout;

  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.trim();

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);
  });

  console.log("🔍 Search listener setup complete");
}

// 🔍 Perform search filtering
function performSearch(searchTerm) {
  console.log(`🔍 Searching for: "${searchTerm}"`);

  if (!searchTerm) {
    renderTeamsGrid(); // Show all teams
    return;
  }

  const searchLower = searchTerm.toLowerCase();

  const filteredTeams = dashboardData.teams.filter((team) => {
    // Search in team details
    const teamMatches =
      team.teamName?.toLowerCase().includes(searchLower) ||
      team.college?.toLowerCase().includes(searchLower) ||
      team.leadEmail?.toLowerCase().includes(searchLower) ||
      team.leaderName?.toLowerCase().includes(searchLower) ||
      team.transactionId?.toLowerCase().includes(searchLower);

    // Search in members
    const memberMatches = team.members?.some(
      (member) =>
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.enrollment?.toLowerCase().includes(searchLower)
    );

    return teamMatches || memberMatches;
  });

  // Render filtered results
  const container = document.getElementById("teams-container");

  if (filteredTeams.length === 0) {
    container.innerHTML = `
            <div class="loading">
                <i class="fas fa-search"></i>
                <p>No teams match your search: "${searchTerm}"</p>
            </div>
        `;
    return;
  }

  const teamsHTML = filteredTeams.map((team) => createTeamCard(team)).join("");
  container.innerHTML = `<div class="teams-grid">${teamsHTML}</div>`;

  console.log(`🔍 Found ${filteredTeams.length} teams matching search`);
}

// 🔄 Setup refresh listener
function setupRefreshListener() {
  // Global refresh function
  window.refreshData = handleRefresh;
}

// 📤 Setup export listener
function setupExportListener() {
  // Global export function
  window.exportData = handleExport;
}

// 🚪 Setup logout listener
function setupLogoutListener() {
  // Global logout function
  window.logout = handleLogout;
}

// 🔄 Handle refresh
async function handleRefresh() {
  console.log("🔄 Refreshing dashboard data...");

  const container = document.getElementById("teams-container");
  container.innerHTML =
    '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Refreshing...</div>';

  await loadDashboardData();
}

// 📤 Handle export
function handleExport() {
  console.log("📤 Exporting dashboard data...");

  const dataStr = JSON.stringify(
    {
      stats: dashboardData.stats,
      teams: dashboardData.teams,
      exportDate: new Date().toISOString(),
    },
    null,
    2
  );

  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `vinyas_admin_data_${
    new Date().toISOString().split("T")[0]
  }.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  alert("✅ Data exported successfully!");
}

// 🚪 Handle logout
async function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    console.log("👋 Logging out...");

    try {
      // Call backend logout API to clear session
      const response = await fetch("/api/auth/admin/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include session cookies
      });

      if (response.ok) {
        console.log("✅ Logout successful");
      } else {
        console.warn("⚠️ Logout API failed, but proceeding with redirect");
      }
    } catch (error) {
      console.error("❌ Logout API error:", error);
      console.log("🔄 Proceeding with redirect anyway");
    }

    // Clear any client-side data
    dashboardData = {
      stats: {},
      teams: [],
      isLoading: false,
    };

    // Redirect to login page
    window.location.href = "/admin/login";
  }
}

// 💾 Show loading state
function showLoadingState() {
  const container = document.getElementById("teams-container");
  if (container) {
    container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading dashboard data...</p>
            </div>
        `;
  }
}

// ❌ Show error state
function showErrorState(message) {
  const container = document.getElementById("teams-container");
  if (container) {
    container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="window.location.reload()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
  }
}

// 🗑️ Delete Team Function
async function deleteTeam(teamId, teamName) {
  console.log(`🗑️ Attempting to delete team: ${teamName} (ID: ${teamId})`);

  // Show confirmation dialog
  const confirmed = confirm(
    `⚠️ Are you sure you want to delete the team "${teamName}"?\n\n` +
      `This will permanently delete:\n` +
      `• Team registration details\n` +
      `• All team members\n` +
      `• PPT submission (if any)\n` +
      `• Payment screenshot\n\n` +
      `This action cannot be undone!`
  );

  if (!confirmed) {
    console.log("❌ Team deletion cancelled by user");
    return;
  }

  try {
    console.log(`🔄 Sending delete request for team ${teamId}...`);

    const response = await fetch(`/api/admin/teams/${teamId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Team "${teamName}" deleted successfully`);

      // Show success message
      alert(`✅ Team "${teamName}" has been deleted successfully!`);

      // Reload dashboard data to refresh the UI
      await loadDashboardData();
    } else {
      console.error("❌ Delete team failed:", data.message);
      alert(`❌ Failed to delete team: ${data.message}`);
    }
  } catch (error) {
    console.error("❌ Error deleting team:", error);
    alert("❌ Error deleting team. Please try again.");
  }
}

// 📧 Send Verification Mail Function
async function sendVerificationMail(teamId, teamName, leaderEmail) {
  console.log(
    `📧 Sending verification mail to team: ${teamName} (${leaderEmail})`
  );

  // Show confirmation dialog
  const confirmed = confirm(
    `📧 Send verification email to "${teamName}"?\n\n` +
      `Email will be sent to: ${leaderEmail}\n\n` +
      `This will notify them that their team is verified for Hack Vinyas 2K25.`
  );

  if (!confirmed) {
    console.log("❌ Mail sending cancelled by user");
    return;
  }

  try {
    console.log(`📤 Sending verification email for team ${teamId}...`);

    const response = await fetch("/api/admin/send-verification-mail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        teamId: teamId,
        teamName: teamName,
        leaderEmail: leaderEmail,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Verification email sent to ${leaderEmail}`);
      alert(
        `✅ Verification email sent successfully to "${teamName}" at ${leaderEmail}!`
      );
    } else {
      console.error("❌ Send mail failed:", data.message);
      alert(`❌ Failed to send email: ${data.message}`);
    }
  } catch (error) {
    console.error("❌ Error sending verification mail:", error);
    alert("❌ Error sending email. Please try again.");
  }
}

// Expose functions globally
window.viewPPT = viewPPT;
window.viewScreenshot = viewScreenshot;
window.toggleTeamDetails = toggleTeamDetails;
window.refreshData = handleRefresh;
window.exportData = handleExport;
window.logout = handleLogout;

console.log("✅ Vinyas Admin Home Dashboard Script Loaded Successfully!");
console.log("🏠 Ready for admin operations...");
