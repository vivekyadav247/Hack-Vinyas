// Registration form handler
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Registration script loaded");

  // Form elements
  const form = document.getElementById("registrationForm");
  const steps = document.querySelectorAll(".step");
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  let currentStep = 1;
  let isEmailVerified = false;

  console.log("🔍 Form elements found:", {
    form: !!form,
    sendOtpBtn: !!sendOtpBtn,
    verifyOtpBtn: !!verifyOtpBtn,
    nextBtn: !!nextBtn,
    submitBtn: !!submitBtn,
  });

  // Step navigation
  function showStep(stepNumber) {
    console.log(`📍 Showing step ${stepNumber}`);
    steps.forEach((step, index) => {
      if (index + 1 === stepNumber) {
        step.style.display = "block";
      } else {
        step.style.display = "none";
      }
    });
    currentStep = stepNumber;
  }

  // Show success message
  function showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "alert alert-success";
    successDiv.textContent = message;
    form.insertBefore(successDiv, form.firstChild);

    setTimeout(() => {
      successDiv.remove();
    }, 5000);
  }

  // Show error message
  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.firstChild);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Send OTP
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", async function () {
      console.log("📧 Send OTP button clicked");

      const email = document.getElementById("leaderEmail").value;
      const name = document.getElementById("leaderName").value;

      if (!email || !name) {
        showError("Please fill in both name and email");
        return;
      }

      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = "Sending...";

      try {
        const response = await fetch("/api/teams/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "send_otp",
            email: email,
            name: name,
          }),
        });

        const result = await response.json();
        console.log("📧 OTP response:", result);

        if (result.success) {
          showSuccess(result.message);
          document.getElementById("otpSection").style.display = "block";
        } else {
          showError(result.message);
        }
      } catch (error) {
        console.error("❌ OTP send error:", error);
        showError("Failed to send OTP. Please try again.");
      } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Send OTP";
      }
    });
  }

  // Verify OTP
  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener("click", async function () {
      console.log("🔐 Verify OTP button clicked");

      const email = document.getElementById("leaderEmail").value;
      const otp = document.getElementById("otp").value;

      if (!otp) {
        showError("Please enter the OTP");
        return;
      }

      verifyOtpBtn.disabled = true;
      verifyOtpBtn.textContent = "Verifying...";

      try {
        const response = await fetch("/api/teams/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "verify_otp",
            email: email,
            otp: otp,
          }),
        });

        const result = await response.json();
        console.log("🔐 OTP verification response:", result);

        if (result.success) {
          showSuccess(result.message);
          isEmailVerified = true;
          document.getElementById("nextSection").style.display = "block";
        } else {
          showError(result.message);
        }
      } catch (error) {
        console.error("❌ OTP verification error:", error);
        showError("Failed to verify OTP. Please try again.");
      } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = "Verify OTP";
      }
    });
  }

  // Next button to go to team details
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      console.log("➡️ Next button clicked");
      if (isEmailVerified) {
        showStep(2);
      } else {
        showError("Please verify your email first");
      }
    });
  }

  // Form submission
  if (submitBtn) {
    submitBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      console.log("📝 Submit button clicked");

      if (!isEmailVerified) {
        showError("Please verify your email first");
        return;
      }

      // Validate payment fields
      const paymentScreenshot = document.getElementById("paymentScreenshot");
      const transactionId = document.getElementById("transactionId");

      if (!paymentScreenshot.files || paymentScreenshot.files.length === 0) {
        showError(
          "Payment screenshot is required. Please upload your payment screenshot."
        );
        return;
      }

      if (!transactionId.value || transactionId.value.trim() === "") {
        showError(
          "Transaction ID is required. Please enter your payment transaction ID."
        );
        return;
      }

      // Validate minimum team members (leader + 5 members = 6 total)
      const member2Name = document.getElementById("member2Name").value;
      const member2Enrollment =
        document.getElementById("member2Enrollment").value;
      const member3Name = document.getElementById("member3Name").value;
      const member3Enrollment =
        document.getElementById("member3Enrollment").value;
      const member4Name = document.getElementById("member4Name").value;
      const member4Enrollment =
        document.getElementById("member4Enrollment").value;
      const member5Name = document.getElementById("member5Name").value;
      const member5Enrollment =
        document.getElementById("member5Enrollment").value;
      const member6Name = document.getElementById("member6Name").value;
      const member6Enrollment =
        document.getElementById("member6Enrollment").value;

      if (
        !member2Name ||
        !member2Enrollment ||
        !member3Name ||
        !member3Enrollment ||
        !member4Name ||
        !member4Enrollment ||
        !member5Name ||
        !member5Enrollment ||
        !member6Name ||
        !member6Enrollment
      ) {
        showError(
          "All 6 team members are required (Leader + 5 additional members). Please fill all member details."
        );
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Registering...";

      try {
        const formData = new FormData();

        // Add action
        formData.append("action", "register_team");

        // Add all form fields
        const inputs = form.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          if (input.type === "file") {
            if (input.files[0]) {
              formData.append(input.name, input.files[0]);
            }
          } else if (input.value && input.value.trim()) {
            formData.append(input.name, input.value.trim());
          }
        });

        console.log("📤 Sending registration data...");

        const response = await fetch("/api/teams/register", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("📝 Registration response:", result);

        if (result.success) {
          showSuccess(result.message);
          showStep(3); // Show success step

          // Show registration details
          if (document.getElementById("successTeamId")) {
            document.getElementById("successTeamId").textContent =
              result.teamId;
          }
          if (document.getElementById("successTeamSize")) {
            document.getElementById("successTeamSize").textContent =
              result.teamSize;
          }
          if (document.getElementById("successPaymentStatus")) {
            document.getElementById("successPaymentStatus").textContent =
              result.paymentStatus || "pending";
          }
        } else {
          showError(result.message);
        }
      } catch (error) {
        console.error("❌ Registration error:", error);
        showError("Registration failed. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register Team";
      }
    });
  }

  // Initialize form
  showStep(1);
  setupFileUpload();
  console.log("✅ Registration form initialized");
});

// File upload preview functionality
function setupFileUpload() {
  const fileInput = document.getElementById("paymentScreenshot");
  const preview = document.getElementById("screenshotPreview");
  const previewImage = document.getElementById("screenshotImage");
  const uploadLabel = document.querySelector(".file-upload-label");

  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          showError("Please select an image file (JPG, PNG, JPEG)");
          return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          showError("File size must be less than 10MB");
          return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function (e) {
          previewImage.src = e.target.result;
          preview.style.display = "block";
          uploadLabel.style.display = "none";
        };
        reader.readAsDataURL(file);

        console.log("📷 Payment screenshot selected:", file.name);
      }
    });

    // Drag and drop functionality
    uploadLabel.addEventListener("dragover", function (e) {
      e.preventDefault();
      uploadLabel.classList.add("dragover");
    });

    uploadLabel.addEventListener("dragleave", function (e) {
      e.preventDefault();
      uploadLabel.classList.remove("dragover");
    });

    uploadLabel.addEventListener("drop", function (e) {
      e.preventDefault();
      uploadLabel.classList.remove("dragover");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        fileInput.dispatchEvent(new Event("change"));
      }
    });
  }
}

// Remove file function
function removeFile(inputId) {
  const fileInput = document.getElementById(inputId);
  const preview = document.getElementById("screenshotPreview");
  const uploadLabel = document.querySelector(".file-upload-label");

  if (fileInput) {
    fileInput.value = "";
    preview.style.display = "none";
    uploadLabel.style.display = "flex";
    console.log("🗑️ Payment screenshot removed");
  }
}
