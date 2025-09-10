// PPT Submission Page JavaScript

let otpTimer;
let isEmailVerified = false;
let isOtpVerified = false;

document.addEventListener("DOMContentLoaded", function () {
  initializePPTSubmission();
  initializeAutoHideNavbar();
  initializeHoverDropdown();
});

function initializePPTSubmission() {
  // Email and OTP verification
  document.getElementById("sendOtpBtn").addEventListener("click", sendOTP);
  document.getElementById("verifyOtpBtn").addEventListener("click", verifyOTP);
  document.getElementById("resendOtpBtn").addEventListener("click", resendOTP);

  // OTP input formatting
  const otpInput = document.getElementById("otp");
  otpInput.addEventListener("input", function () {
    // Only allow numbers
    this.value = this.value.replace(/[^0-9]/g, "");

    // Auto-verify when 6 digits entered
    if (this.value.length === 6) {
      setTimeout(() => {
        verifyOTP();
      }, 500);
    }
  });

  // File upload functionality
  initializeFileUpload();

  // Form submission
  document
    .getElementById("pptForm")
    .addEventListener("submit", handleFormSubmission);

  // Check form validity immediately since no reCAPTCHA is required
}

// Check if form is ready for submission
function checkFormValidity() {
  const submitBtn = document.getElementById("submitBtn");
  const fileInput = document.getElementById("pptFile");

  const hasFile = fileInput.files.length > 0;
  const isOtpValid = isOtpVerified;

  console.log("Form validity check:", {
    hasFile,
    isOtpValid,
  });

  // Enable submit button only if all conditions are met
  if (hasFile && isOtpValid) {
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
  } else {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.6";
  }
}

// Email verification and OTP functions
function sendOTP() {
  const email = document.getElementById("email").value;

  if (!email || !isValidEmail(email)) {
    showNotification("Please enter a valid email address", "error");
    return;
  }

  // First check if email exists
  const sendBtn = document.getElementById("sendOtpBtn");
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';

  // Check email existence first
  fetch("/api/teams/check-email-exists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.userExists) {
        // Email exists, now send OTP
        sendOTPToEmail(email, data.teamName);
      } else {
        // Email doesn't exist
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
        showNotification(
          data.message ||
            "User does not exist. Please check your email or register first.",
          "error"
        );
      }
    })
    .catch((error) => {
      console.error("Error checking email:", error);
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
      showNotification("Network error. Please try again.", "error");
    });
}

function sendOTPToEmail(email, teamName) {
  const sendBtn = document.getElementById("sendOtpBtn");
  sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';

  // Send OTP to verified email
  fetch("/api/teams/send-ppt-submission-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show OTP section inline
        document.getElementById("otpSection").style.display = "block";
        sendBtn.innerHTML = '<i class="fas fa-check"></i> OTP Sent';
        sendBtn.style.background = "var(--accent-cyan)";

        // Store team name for later use
        document.getElementById("teamName").value = data.teamName;

        startOTPTimer();
        showNotification("OTP sent to your email!", "success");
      } else {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
        showNotification(
          data.message || "Failed to send OTP. Please try again.",
          "error"
        );
      }
    })
    .catch((error) => {
      console.error("Error sending OTP:", error);
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
      showNotification("Network error. Please try again.", "error");
    });
}

function verifyOTP() {
  const otp = document.getElementById("otp").value;
  const email = document.getElementById("email").value;

  if (!otp || otp.length !== 6) {
    showNotification("Please enter a valid 6-digit OTP", "error");
    return;
  }

  const verifyBtn = document.getElementById("verifyOtpBtn");
  verifyBtn.disabled = true;
  verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

  // Call API to verify OTP
  fetch("/api/teams/verify-ppt-submission-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      otp: otp,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        isOtpVerified = true;

        // Check form validity after OTP verification
        checkFormValidity();

        // Update UI to show verification success
        const otpInput = document.getElementById("otp");
        otpInput.style.borderColor = "var(--accent-cyan)";
        otpInput.style.boxShadow = "0 0 25px rgba(6, 182, 212, 0.3)";
        otpInput.disabled = true;

        // Update verify button
        verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verified';
        verifyBtn.style.background = "#10b981";

        // Update timer display
        clearInterval(otpTimer);
        const timerElement = document.getElementById("otpTimer");
        timerElement.innerHTML =
          '<i class="fas fa-check-circle" style="color: #10b981;"></i> OTP Verified Successfully!';

        // Show next sections with animation
        const teamSection = document.getElementById("teamNameSection");
        const uploadSection = document.getElementById("uploadSection");

        teamSection.style.display = "block";
        uploadSection.style.display = "block";

        // Auto-fill team name if provided
        if (data.teamInfo && data.teamInfo.teamName) {
          document.getElementById("teamName").value = data.teamInfo.teamName;
        }

        // Auto-scroll to next section
        setTimeout(() => {
          teamSection.scrollIntoView({ behavior: "smooth" });
        }, 500);

        showNotification("Email verified successfully!", "success");
      } else {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify OTP';

        showNotification(
          data.message || "Invalid OTP. Please try again.",
          "error"
        );
        const otpInput = document.getElementById("otp");
        otpInput.style.borderColor = "#ef4444";
        otpInput.style.boxShadow = "0 0 25px rgba(239, 68, 68, 0.3)";
        otpInput.focus();
        otpInput.select();
      }
    })
    .catch((error) => {
      console.error("Error verifying OTP:", error);
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify OTP';
      showNotification("Network error. Please try again.", "error");
    });
}

function resendOTP() {
  const email = document.getElementById("email").value;
  const resendBtn = document.getElementById("resendOtpBtn");

  resendBtn.style.display = "none";
  resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resending...';

  // Call API to resend OTP
  fetch("/api/teams/send-ppt-submission-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("otpTimer").style.display = "block";
        startOTPTimer();

        // Clear and enable OTP input
        const otpInput = document.getElementById("otp");
        otpInput.value = "";
        otpInput.disabled = false;
        otpInput.style.borderColor = "";
        otpInput.style.boxShadow = "";

        // Reset verify button
        const verifyBtn = document.getElementById("verifyOtpBtn");
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify OTP';
        verifyBtn.style.background = "";

        showNotification("OTP resent successfully!", "success");
      } else {
        showNotification(
          data.message || "Failed to resend OTP. Please try again.",
          "error"
        );
      }
    })
    .catch((error) => {
      console.error("Error resending OTP:", error);
      showNotification("Network error. Please try again.", "error");
    })
    .finally(() => {
      resendBtn.innerHTML = '<i class="fas fa-redo"></i> Resend OTP';
    });
}

function startOTPTimer() {
  let timeLeft = 60;
  const countdown = document.getElementById("countdown");

  otpTimer = setInterval(() => {
    timeLeft--;
    countdown.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      document.getElementById("otpTimer").style.display = "none";
      document.getElementById("resendOtpBtn").style.display = "block";
    }
  }, 1000);
}

// File upload functionality
function initializeFileUpload() {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("pptFile");
  const filePreview = document.getElementById("filePreview");
  const removeBtn = document.getElementById("removeFile");

  // Click to upload
  uploadArea.addEventListener("click", () => {
    if (isOtpVerified) {
      fileInput.click();
    } else {
      alert("Please verify your email first");
    }
  });

  // Drag and drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (isOtpVerified) {
      uploadArea.classList.add("dragover");
    }
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");

    if (!isOtpVerified) {
      alert("Please verify your email first");
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Remove file
  removeBtn.addEventListener("click", () => {
    fileInput.value = "";
    filePreview.style.display = "none";
    uploadArea.style.display = "block";
    updateSubmitButton();
  });
}

function handleFileSelection(file) {
  // Validate file type
  const allowedTypes = [".ppt", ".pptx", ".pdf"];
  const fileExtension = "." + file.name.split(".").pop().toLowerCase();

  if (!allowedTypes.includes(fileExtension)) {
    alert("Please select a .ppt, .pptx, or .pdf file");
    return;
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showNotification("File size must be less than 10MB", "error");
    return;
  }

  // Show file preview
  document.getElementById("fileName").textContent = file.name;
  document.getElementById("fileSize").textContent = formatFileSize(file.size);

  uploadArea.style.display = "none";
  filePreview.style.display = "block";

  // Simulate upload progress
  simulateUploadProgress();

  updateSubmitButton();
}

function simulateUploadProgress() {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;

    progressFill.style.width = progress + "%";
    progressText.textContent = Math.round(progress) + "%";

    if (progress >= 100) {
      clearInterval(interval);
      showNotification("File uploaded successfully!", "success");
    }
  }, 200);
}

function updateSubmitButton() {
  // Use the new checkFormValidity function instead
  checkFormValidity();
}

// Form submission
async function handleFormSubmission(event) {
  event.preventDefault();

  if (!isOtpVerified) {
    showNotification("Please verify your email first", "error");
    return;
  }

  const fileInput = document.getElementById("pptFile");
  if (!fileInput.files.length) {
    showNotification("Please select a file to upload", "error");
    return;
  }

  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;

  // Show loading state
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("pptFile", fileInput.files[0]);
    formData.append("email", email);
    formData.append("otp", otp);

    console.log("📤 Sending FormData:");
    console.log("Email:", email);
    console.log("OTP:", otp);
    console.log("File:", fileInput.files[0].name);

    // Submit to verified endpoint
    const response = await fetch("/api/upload/ppt-submission-verified", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;

    if (data.success) {
      showNotification("PPT submitted successfully!", "success");

      // Show success details
      showSuccessDetails(data.submission);

      // Redirect after success
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } else {
      showNotification(
        data.message || "Failed to submit PPT. Please try again.",
        "error"
      );
    }
  } catch (error) {
    console.error("Error submitting PPT:", error);
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
    showNotification(
      error.message || "Network error. Please try again.",
      "error"
    );
  }
}

function showSuccessDetails(submission) {
  const detailsHtml = `
        <div class="success-details">
            <h3>📋 Submission Details</h3>
            <p><strong>Team:</strong> ${submission.teamName}</p>
            <p><strong>File:</strong> ${submission.fileName}</p>
            <p><strong>Size:</strong> ${submission.fileSize}</p>
            <p><strong>Status:</strong> ${submission.status}</p>
            <p><strong>Submission ID:</strong> ${submission.id}</p>
            ${
              submission.isLateSubmission
                ? '<p style="color: orange;"><strong>⚠️ Late Submission</strong></p>'
                : ""
            }
        </div>
    `;

  // You can show this in a modal or replace some content
  console.log("Submission successful:", submission);
}

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        ${message}
    `;

  // Add to page
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Auto-hiding navbar functionality
function initializeAutoHideNavbar() {
  const navbar = document.querySelector(".navbar-neon");
  const hoverZone = document.getElementById("navbarHoverZone");

  if (!navbar) return;

  let lastScrollY = window.scrollY;
  let isNavbarVisible = true;
  let hoverTimeout;

  // Function to show navbar
  function showNavbar() {
    navbar.classList.remove("navbar-hidden");
    navbar.classList.add("navbar-visible");
    isNavbarVisible = true;
  }

  // Function to hide navbar
  function hideNavbar() {
    navbar.classList.remove("navbar-visible");
    navbar.classList.add("navbar-hidden");
    isNavbarVisible = false;
  }

  // Scroll event listener
  function handleScroll() {
    const currentScrollY = window.scrollY;

    // If at top of page, always show navbar
    if (currentScrollY <= 100) {
      showNavbar();
      return;
    }

    // If scrolling up, show navbar
    if (currentScrollY < lastScrollY && !isNavbarVisible) {
      showNavbar();
    }
    // If scrolling down and past threshold, hide navbar
    else if (
      currentScrollY > lastScrollY &&
      currentScrollY > 200 &&
      isNavbarVisible
    ) {
      hideNavbar();
    }

    lastScrollY = currentScrollY;
  }

  // Hover zone event listeners
  if (hoverZone) {
    hoverZone.addEventListener("mouseenter", function () {
      clearTimeout(hoverTimeout);
      if (!isNavbarVisible && window.scrollY > 100) {
        showNavbar();
      }
    });

    // Hide navbar when mouse leaves navbar area
    navbar.addEventListener("mouseleave", function (e) {
      if (window.scrollY > 100 && isNavbarVisible) {
        const rect = navbar.getBoundingClientRect();
        if (e.clientY > rect.bottom + 20) {
          // 20px buffer
          hoverTimeout = setTimeout(() => {
            hideNavbar();
          }, 800);
        }
      }
    });

    // Cancel hide timeout when entering navbar
    navbar.addEventListener("mouseenter", function () {
      clearTimeout(hoverTimeout);
    });

    // Also handle hover zone leave
    hoverZone.addEventListener("mouseleave", function (e) {
      if (window.scrollY > 100 && isNavbarVisible) {
        if (e.clientY > 80) {
          // Moving away from top area
          hoverTimeout = setTimeout(() => {
            hideNavbar();
          }, 800);
        }
      }
    });
  }

  // Throttled scroll listener
  let scrollTimeout;
  window.addEventListener("scroll", function () {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(function () {
        handleScroll();
        scrollTimeout = null;
      }, 16); // ~60fps
    }
  });

  // Initialize navbar state
  if (window.scrollY <= 100) {
    showNavbar();
  } else {
    hideNavbar();
  }
}

// Initialize hover-based dropdown
function initializeHoverDropdown() {
  // Disable Bootstrap dropdown click behavior
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      return false;
    });

    // Remove Bootstrap data attributes to prevent click behavior
    toggle.removeAttribute("data-bs-toggle");
    toggle.removeAttribute("aria-expanded");
  });

  // Handle dropdown behavior with JavaScript for better control
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    const menu = dropdown.querySelector(".dropdown-menu");
    let hoverTimeout;

    if (menu) {
      // Show dropdown on hover
      dropdown.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimeout);
        menu.style.display = "block";
        menu.style.opacity = "1";
        menu.style.visibility = "visible";
        menu.style.transform = "translateY(0)";
      });

      // Hide dropdown when leaving both dropdown and menu
      dropdown.addEventListener("mouseleave", () => {
        hoverTimeout = setTimeout(() => {
          menu.style.opacity = "0";
          menu.style.visibility = "hidden";
          menu.style.transform = "translateY(-10px)";
          setTimeout(() => {
            menu.style.display = "none";
          }, 300);
        }, 100); // Small delay to allow moving to menu
      });

      // Keep menu open when hovering over it
      menu.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimeout);
      });

      // Hide menu when leaving it
      menu.addEventListener("mouseleave", () => {
        hoverTimeout = setTimeout(() => {
          menu.style.opacity = "0";
          menu.style.visibility = "hidden";
          menu.style.transform = "translateY(-10px)";
          setTimeout(() => {
            menu.style.display = "none";
          }, 300);
        }, 100);
      });

      // Initially hide the menu
      menu.style.display = "none";
      menu.style.opacity = "0";
      menu.style.visibility = "hidden";
      menu.style.transform = "translateY(-10px)";
    }
  });
}
