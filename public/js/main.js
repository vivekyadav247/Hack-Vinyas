// Enhanced Main Page JavaScript for Hack Vinyas

// DOM references
const joinBtn = document.getElementById("joinBtn");
const adminBtn = document.getElementById("adminBtn");

// Initialize page animations and interactions
document.addEventListener("DOMContentLoaded", function () {
  initializeAnimations();
  initializeParticles();
  initializeScrollEffects();
  initializeInteractiveElements();
  setupScrollAnimations();
  preloadResources();
  initializeAutoHideNavbar();
  initializeDropdownNavigation();
  initializeHoverDropdown();

  // Fix button functionality
  initializeButtonHandlers();
});

// Enhanced scroll animations
function setupScrollAnimations() {
  const animateElements = document.querySelectorAll(".animate-on-scroll");

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -10% 0px",
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  animateElements.forEach((element) => {
    scrollObserver.observe(element);
  });

  // Parallax effect for floating elements
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    document.querySelectorAll(".floating-element").forEach((element, index) => {
      const speed = (index + 1) * 0.3;
      element.style.transform = `translateY(${rate * speed}px)`;
    });
  });
}

// Initialize entrance animations
function initializeAnimations() {
  // Animate hero content on load
  const heroElements = document.querySelectorAll(".hero-inner > *");
  heroElements.forEach((element, index) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";

    setTimeout(() => {
      element.style.transition = "all 0.8s ease";
      element.style.opacity = "1";
      element.style.transform = "translateY(0)";
    }, index * 200);
  });

  // Enhanced card animations
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0) scale(1)";
        }, index * 100);
      }
    });
  }, observerOptions);

  // Observe all cards with enhanced animations
  document
    .querySelectorAll(
      ".card, .sched-card, .timeline-item, .feature-item, .stat-card"
    )
    .forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px) scale(0.95)";
      card.style.transition = "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      observer.observe(card);
    });
}

// Create floating particles effect
function initializeParticles() {
  const particleContainer = document.createElement("div");
  particleContainer.className = "particles";
  document.body.appendChild(particleContainer);

  // Create particles
  for (let i = 0; i < 50; i++) {
    createParticle(particleContainer);
  }
}

function createParticle(container) {
  const particle = document.createElement("div");
  particle.className = "particle";

  // Random starting position
  particle.style.left = Math.random() * 100 + "vw";
  particle.style.animationDelay = Math.random() * 15 + "s";
  particle.style.animationDuration = Math.random() * 10 + 10 + "s";

  container.appendChild(particle);

  // Remove and recreate particle after animation
  setTimeout(() => {
    if (particle.parentNode) {
      particle.remove();
      createParticle(container);
    }
  }, 15000);
}

// Enhanced scroll effects
function initializeScrollEffects() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Parallax effect for floating elements
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll(".floating-element");

    parallaxElements.forEach((element, index) => {
      const speed = 0.5 + index * 0.2;
      element.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });
}

// Interactive elements
function initializeInteractiveElements() {
  // Enhanced join button click
  if (joinBtn) {
    joinBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Add click animation
      joinBtn.style.transform = "scale(0.95)";
      setTimeout(() => {
        joinBtn.style.transform = "";
      }, 150);

      // Smooth scroll to cards section
      const cardsSection = document.getElementById("cards");
      if (cardsSection) {
        cardsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  }

  // Admin button click
  if (adminBtn) {
    adminBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Add click animation
      adminBtn.style.transform = "scale(0.95)";
      setTimeout(() => {
        adminBtn.style.transform = "";
      }, 150);

      // Redirect to admin login
      window.location.href = "/admin/login";
    });
  }

  // Add hover effects to cards
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-15px) scale(1.02)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });
  });

  // Enhanced button hover effects
  document.querySelectorAll(".btn-neon, .btn-outline-neon").forEach((btn) => {
    btn.addEventListener("mouseenter", function () {
      this.style.boxShadow = "0 0 30px rgba(6, 182, 212, 0.6)";
    });

    btn.addEventListener("mouseleave", function () {
      this.style.boxShadow = "";
    });
  });

  // FAQ interactive functionality
  document.querySelectorAll(".faq-item summary").forEach((summary) => {
    summary.addEventListener("click", function (e) {
      const faqItem = this.closest(".faq-item");
      const isOpen = faqItem.hasAttribute("open");

      // Close all other FAQ items
      document.querySelectorAll(".faq-item[open]").forEach((item) => {
        if (item !== faqItem) {
          item.removeAttribute("open");
        }
      });

      // Add smooth animation
      if (!isOpen) {
        setTimeout(() => {
          const answer = faqItem.querySelector("p");
          if (answer) {
            answer.style.animation = "fadeIn 0.3s ease";
          }
        }, 10);
      }
    });
  });
}

// Modal functionality for problems
function openProblemsModal() {
  const modal = document.getElementById("problemsModal");
  if (modal) {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Animate modal entrance
    const modalPanel = modal.querySelector(".modal-panel");
    modalPanel.style.transform = "scale(0.8) translateY(-50px)";
    modalPanel.style.opacity = "0";

    setTimeout(() => {
      modalPanel.style.transition = "all 0.3s ease";
      modalPanel.style.transform = "scale(1) translateY(0)";
      modalPanel.style.opacity = "1";
    }, 10);
  }
}

function closeProblemsModal() {
  const modal = document.getElementById("problemsModal");
  if (modal) {
    const modalPanel = modal.querySelector(".modal-panel");
    modalPanel.style.transform = "scale(0.8) translateY(-50px)";
    modalPanel.style.opacity = "0";

    setTimeout(() => {
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }, 300);
  }
}

// Close modal on outside click
document.addEventListener("click", function (e) {
  const modal = document.getElementById("problemsModal");
  if (modal && e.target === modal) {
    closeProblemsModal();
  }
});

// Close modal on escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeProblemsModal();
  }
});

// Stats counter animation
function animateStats() {
  const stats = document.querySelectorAll(".stat-number");

  stats.forEach((stat) => {
    const originalText = stat.textContent.trim();

    // Skip animation for non-numeric values like "Exclusive"
    if (
      originalText === "Exclusive" ||
      isNaN(parseInt(originalText.replace(/[^\d]/g, "")))
    ) {
      return;
    }

    const target = parseInt(originalText.replace(/[^\d]/g, ""));
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }

      if (originalText.includes("₹")) {
        stat.textContent = "₹" + Math.floor(current) + "K+";
      } else if (originalText.includes("+")) {
        stat.textContent = Math.floor(current) + "+";
      } else {
        stat.textContent = Math.floor(current);
      }
    }, 20);
  });
}

// Initialize stats animation when hero comes into view
const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateStats();
      heroObserver.disconnect();
    }
  });
});

const heroSection = document.querySelector(".hero");
if (heroSection) {
  heroObserver.observe(heroSection);
}

// SIH-Style Timeline Animation
function animateTimeline() {
  const timelineEvents = document.querySelectorAll(".timeline-event");

  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("animate");
          }, 100);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  timelineEvents.forEach((event) => {
    timelineObserver.observe(event);
  });
}

// Initialize timeline animation when page loads
document.addEventListener("DOMContentLoaded", () => {
  animateTimeline();
});

// Preload critical resources
function preloadResources() {
  const criticalImages = ["/images/Background.jpg"];

  criticalImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// Dropdown navigation functionality
function initializeDropdownNavigation() {
  const dropdownText = document.getElementById("dropdownText");
  const dropdownItems = document.querySelectorAll(
    ".dropdown-item[data-section]"
  );

  if (dropdownText && dropdownItems.length > 0) {
    // Update dropdown text based on current section in viewport
    const updateDropdownText = () => {
      const sections = ["about", "rules", "schedule"];
      const dropdownTextMap = {
        about: { text: "About", icon: "fas fa-info-circle" },
        rules: { text: "Rules", icon: "fas fa-list-check" },
        schedule: { text: "Event Timeline", icon: "fas fa-calendar-alt" },
      };

      let activeSection = "schedule"; // default

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            activeSection = sectionId;
            break;
          }
        }
      }

      const config = dropdownTextMap[activeSection];
      if (config) {
        const iconElement = dropdownText.previousElementSibling;
        if (iconElement) {
          iconElement.className = `${config.icon} me-1`;
        }
        dropdownText.textContent = config.text;
      }
    };

    // Update on scroll
    let scrollTimeout;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateDropdownText, 100);
    });

    // Update on dropdown item click
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const section = e.target.closest("[data-section]").dataset.section;
        const config = {
          about: { text: "About", icon: "fas fa-info-circle" },
          rules: { text: "Rules", icon: "fas fa-list-check" },
          schedule: { text: "Event Timeline", icon: "fas fa-calendar-alt" },
        }[section];

        if (config) {
          setTimeout(() => {
            const iconElement = dropdownText.previousElementSibling;
            if (iconElement) {
              iconElement.className = `${config.icon} me-1`;
            }
            dropdownText.textContent = config.text;
          }, 500);
        }
      });
    });

    // Initial update
    setTimeout(updateDropdownText, 1000);
  }
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

// Initialize dropdown when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initializeDropdownNavigation();
});

// Fix button functionality
function initializeButtonHandlers() {
  console.log("🔧 Initializing Chrome-compatible button handlers...");

  // Chrome-specific fixes - Force enable clicks on all buttons
  const allBtns = document.querySelectorAll(".btn-neon, .btn");
  allBtns.forEach((btn, index) => {
    // Remove any existing problematic attributes
    btn.style.pointerEvents = "auto";
    btn.style.cursor = "pointer";

    // Force Z-index to ensure buttons are clickable
    btn.style.zIndex = "999";
    btn.style.position = "relative";

    console.log(`✅ Chrome-fixed button ${index + 1}`);
  });

  // Legacy fallback for onclick buttons if any remain
  const onclickButtons = document.querySelectorAll(
    "button[onclick], a[onclick]"
  );
  onclickButtons.forEach((btn) => {
    const onclickAttr = btn.getAttribute("onclick");
    if (onclickAttr) {
      btn.removeAttribute("onclick");

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        try {
          // Safe execution
          if (onclickAttr.includes("window.location.href")) {
            const urlMatch = onclickAttr.match(/['"`]([^'"`]+)['"`]/);
            if (urlMatch) {
              const url = urlMatch[1];
              if (url.startsWith("http")) {
                window.open(url, "_blank");
              } else {
                window.location.href = url;
              }
            }
          }
        } catch (error) {
          console.error("Button click error:", error);
        }
      });
    }
  });

  console.log("🎉 Chrome-compatible handlers initialized!");
}
