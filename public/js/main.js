// Wait for document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  "use strict";

  // Loading screen
  const loadingScreen = document.createElement('div');
  loadingScreen.className = 'loading';
  loadingScreen.innerHTML = '<div class="loading-animation"></div>';
  document.body.appendChild(loadingScreen);

  // Hide loading screen after 1 second
  setTimeout(function() {
    loadingScreen.style.opacity = "0";
    setTimeout(function() {
      loadingScreen.style.display = "none";
    }, 500);
  }, 1000);

  // Initialize Swiper for featured programs
  const programsSwiper = new Swiper('.featured-programs-slider', {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    breakpoints: {
      640: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
      },
    }
  });

  // Initialize Swiper for testimonials
  const testimonialSwiper = new Swiper('.testimonial-slider', {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    autoplay: {
      delay: 6000,
      disableOnInteraction: false,
    },
    breakpoints: {
      640: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
      },
    }
  });

  // Back to top button
  const backToTopBtn = document.querySelector('.back-to-top');
  
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('active');
    } else {
      backToTopBtn.classList.remove('active');
    }
  });

  backToTopBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      if (this.hash !== '') {
        e.preventDefault();
        
        const hash = this.hash;
        
        document.querySelector(hash).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // GSAP Animations
  if (typeof gsap !== 'undefined') {
    // Hero section animations
    gsap.from('.hero-title', {
      duration: 1.2,
      opacity: 0,
      y: 50,
      ease: 'power3.out',
      delay: 0.5
    });

    gsap.from('.hero-text', {
      duration: 1.2,
      opacity: 0,
      y: 30,
      ease: 'power3.out',
      delay: 0.8
    });

    gsap.from('.hero-buttons', {
      duration: 1,
      opacity: 0,
      y: 20,
      ease: 'power3.out',
      delay: 1
    });

    // Scroll trigger animations
    if (typeof ScrollTrigger !== 'undefined') {
      // Features section animations
      gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: i * 0.1
        });
      });

      // Gallery section animations
      gsap.utils.toArray('.gallery-item').forEach((item, i) => {
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: i * 0.1
        });
      });
    }
  }

  // Experience Gallery items click to show larger image
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach(item => {
    item.addEventListener('click', function() {
      const imgSrc = this.querySelector('img').src;
      const caption = this.querySelector('.gallery-caption').innerText;
      
      // Create modal for larger image view
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'galleryModal';
      modal.tabIndex = '-1';
      modal.setAttribute('aria-hidden', 'true');
      
      modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Camp Experience</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
              <img src="${imgSrc}" class="img-fluid rounded" alt="Camp Experience">
              <p class="mt-3">${caption}</p>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const galleryModal = new bootstrap.Modal(modal);
      galleryModal.show();
      
      // Remove modal from DOM after it's hidden
      modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
      });
    });
  });

  // Photo sharing form handling
  const photoShareForm = document.getElementById('photoShareForm');
  if (photoShareForm) {
    photoShareForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      if (!this.checkValidity()) {
        event.stopPropagation();
        this.classList.add('was-validated');
        return;
      }
      
      // Here you would typically handle file upload with AJAX
      // For demo purposes, we'll just show a success message
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('sharePhotoModal'));
      modal.hide();
      
      // Create success alert
      const alert = document.createElement('div');
      alert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4';
      alert.style.zIndex = '9999';
      alert.role = 'alert';
      alert.innerHTML = `
        <strong>Thank you!</strong> Your photo has been submitted for review.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      document.body.appendChild(alert);
      
      // Reset form
      this.reset();
      this.classList.remove('was-validated');
      
      // Remove alert after 5 seconds
      setTimeout(() => {
        alert.remove();
      }, 5000);
    });
  }

  // Language switching functionality
  let currentLang = localStorage.getItem('prefLang') || 'ko';
  
  // Update page on initial load
  applyTranslations(currentLang);
  updateLanguageUI(currentLang);
  
  // Language switcher
  const languageBtns = document.querySelectorAll('[data-lang]');
  languageBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const newLang = this.getAttribute('data-lang');
      
      // Save preference
      localStorage.setItem('prefLang', newLang);
      currentLang = newLang;
      
      // Apply translations and update UI
      applyTranslations(newLang);
      updateLanguageUI(newLang);
      
      // Notify the user
      const toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.innerHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <i class="fas fa-globe me-2 text-primary"></i>
            <strong class="me-auto">${newLang === 'en' ? 'Language Changed' : '언어 변경됨'}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">
            ${newLang === 'en' ? 'Website language changed to English' : '웹사이트 언어가 한국어로 변경되었습니다'}
          </div>
        </div>
      `;
      document.body.appendChild(toastContainer);
      
      const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
      toast.show();
      
      setTimeout(() => {
        toastContainer.remove();
      }, 3000);
    });
  });

  // Logout functionality
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Here you would implement actual logout functionality
      localStorage.removeItem('token');
      window.location.href = '/login?logout=success';
    });
  }

  // Form validation (for contact and registration forms)
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });
});

// Apply translations based on selected language
function applyTranslations(lang) {
  // Exit if translations not loaded
  if (!window.translations || !window.translations[lang]) return;
  
  const trans = window.translations[lang];
  
  // Apply translations to elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (trans[key]) {
      elem.textContent = trans[key];
    }
  });
  
  // Apply translations to placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-placeholder');
    if (trans[key]) {
      elem.setAttribute('placeholder', trans[key]);
    }
  });
  
  // Apply translations to value attributes
  document.querySelectorAll('[data-i18n-value]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-value');
    if (trans[key]) {
      elem.setAttribute('value', trans[key]);
    }
  });
  
  // Handle navigation links
  document.querySelectorAll('a.nav-link, a.dropdown-item').forEach(link => {
    const navItemKey = getNavItemKey(link.textContent.trim());
    if (navItemKey && trans[navItemKey]) {
      link.textContent = trans[navItemKey];
    }
  });
  
  // Handle specific sections
  translateHeaderSection(lang, trans);
  translateHeroSection(lang, trans);
  translateFooterSection(lang, trans);
  translateFeaturesSection(lang, trans);
  translateProgramsSection(lang, trans);
  translateTestimonialsSection(lang, trans);
  translateCTASection(lang, trans);
  translateGallerySection(lang, trans);
  translateModalContent(lang, trans);
}

// Update UI to reflect current language
function updateLanguageUI(lang) {
  // Update language selector text
  const languageText = document.querySelector('#languageDropdown');
  if (languageText) {
    languageText.innerHTML = `<i class="fas fa-globe me-1"></i> ${lang.toUpperCase()}`;
  }
  
  // Add active class to current language option
  document.querySelectorAll('[data-lang]').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Helper function to get navigation item key
function getNavItemKey(text) {
  const keyMap = {
    'Home': 'home',
    'Programs': 'programs',
    'About Us': 'about',
    'Contact': 'contact',
    'Login': 'login',
    'Register': 'register',
    'Dashboard': 'dashboard',
    'My Profile': 'myProfile',
    'My Enrollments': 'myEnrollments',
    'Admin Panel': 'adminPanel',
    'Logout': 'logout',
    'Summer Camps': 'summerCamps',
    'Winter Camps': 'winterCamps',
    'Spring Programs': 'springPrograms',
    'Special Programs': 'specialPrograms',
    'All Programs': 'allPrograms'
  };
  
  return keyMap[text];
}

// Translate header section
function translateHeaderSection(lang, trans) {
  // No specific action needed as navigation items are handled separately
}

// Translate hero section
function translateHeroSection(lang, trans) {
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    heroTitle.innerHTML = `
      ${trans.discoverEnriching} <br>
      <span class="text-primary">${trans.usCampPrograms}</span> <br>
      ${trans.with} <span class="text-primary">DSH에듀</span>
    `;
  }
  
  const heroText = document.querySelector('.hero-text');
  if (heroText) {
    heroText.textContent = trans.exploreTopQuality;
  }
  
  const heroBtns = document.querySelectorAll('.hero-buttons .btn');
  if (heroBtns.length >= 2) {
    heroBtns[0].textContent = trans.explorePrograms;
    heroBtns[1].textContent = trans.contactUs;
  }
}

// Translate footer section
function translateFooterSection(lang, trans) {
  // Quick links heading
  const quickLinksHeading = document.querySelector('.footer h6');
  if (quickLinksHeading && quickLinksHeading.textContent.includes('Quick Links')) {
    quickLinksHeading.textContent = trans.quickLinks;
  }
  
  // Contact us heading
  const contactHeadings = document.querySelectorAll('.footer h6');
  contactHeadings.forEach(heading => {
    if (heading.textContent.includes('Contact Us')) {
      heading.textContent = trans.contactInfo;
    }
  });
  
  // Copyright text
  const footerParagraphs = document.querySelectorAll('.footer p');
  footerParagraphs.forEach(p => {
    if (p.textContent.includes('All rights reserved')) {
      p.innerHTML = `&copy; 2023 DSH에듀. ${trans.allRightsReserved}`;
    }
  });
  
  // Footer links
  const footerLinks = document.querySelectorAll('.footer a');
  footerLinks.forEach(link => {
    if (link.getAttribute('href') === '/privacy') {
      link.textContent = trans.privacyPolicy;
    } else if (link.getAttribute('href') === '/terms') {
      link.textContent = trans.termsOfService;
    }
  });
}

// Translate features section
function translateFeaturesSection(lang, trans) {
  // Features heading
  const featuresHeading = document.querySelector('#features h2');
  if (featuresHeading) {
    featuresHeading.textContent = trans.whyChooseOur;
  }
  
  const featuresSubheading = document.querySelector('#features p.lead');
  if (featuresSubheading) {
    featuresSubheading.textContent = trans.experienceBest;
  }
  
  // Feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length >= 6) {
    // Academic Excellence
    featureCards[0].querySelector('h3').textContent = trans.academicExcellence;
    featureCards[0].querySelector('p').textContent = trans.academicExcellenceDesc;
    
    // English Immersion
    featureCards[1].querySelector('h3').textContent = trans.englishImmersion;
    featureCards[1].querySelector('p').textContent = trans.englishImmersionDesc;
    
    // Cultural Exchange
    featureCards[2].querySelector('h3').textContent = trans.culturalExchange;
    featureCards[2].querySelector('p').textContent = trans.culturalExchangeDesc;
    
    // Social Development
    featureCards[3].querySelector('h3').textContent = trans.socialDevelopment;
    featureCards[3].querySelector('p').textContent = trans.socialDevelopmentDesc;
    
    // Safety & Support
    featureCards[4].querySelector('h3').textContent = trans.safetySupport;
    featureCards[4].querySelector('p').textContent = trans.safetySupportDesc;
    
    // Fun Activities
    featureCards[5].querySelector('h3').textContent = trans.funActivities;
    featureCards[5].querySelector('p').textContent = trans.funActivitiesDesc;
  }
}

// Translate programs section
function translateProgramsSection(lang, trans) {
  // Programs heading
  const programsHeading = document.querySelector('#featured-programs h2');
  if (programsHeading) {
    programsHeading.textContent = trans.featuredPrograms;
  }
  
  const programsSubheading = document.querySelector('#featured-programs p.lead');
  if (programsSubheading) {
    programsSubheading.textContent = trans.explorePopular;
  }
  
  // View all programs button
  const viewAllBtn = document.querySelector('#featured-programs a.btn-primary');
  if (viewAllBtn) {
    viewAllBtn.textContent = trans.viewAllPrograms;
  }
  
  // Program cards
  document.querySelectorAll('.program-card .btn-outline-primary').forEach(btn => {
    btn.textContent = trans.viewDetails;
  });
  
  // Age labels
  document.querySelectorAll('.program-details .fa-user-friends').forEach(icon => {
    const container = icon.parentElement;
    const text = container.textContent.trim();
    if (text.includes('Ages')) {
      const age = text.replace('Ages', '').trim();
      container.innerHTML = `
        <i class="fas fa-user-friends text-primary me-2"></i>
        <span>${trans.ages} ${age}</span>
      `;
    }
  });
}

// Translate testimonials section
function translateTestimonialsSection(lang, trans) {
  // Testimonials heading
  const testimonialsHeading = document.querySelector('#testimonials h2');
  if (testimonialsHeading) {
    testimonialsHeading.textContent = trans.whatParentsSay;
  }
  
  const testimonialsSubheading = document.querySelector('#testimonials p.lead');
  if (testimonialsSubheading) {
    testimonialsSubheading.textContent = trans.hearFromFamilies;
  }
  
  // Testimonial parent/student labels
  document.querySelectorAll('.testimonial-card p.text-muted.small').forEach(p => {
    const text = p.textContent.trim();
    if (text.includes('Parent of')) {
      const name = text.replace('Parent of', '').trim();
      p.textContent = `${name} ${trans.parentOf}`;
    } else if (text.includes('Student')) {
      const age = text.replace('Student,', '').trim();
      p.textContent = `${trans.student}, ${age}`;
    }
  });
}

// Translate Experience Gallery section
function translateGallerySection(lang, trans) {
  // Gallery heading
  const galleryHeading = document.querySelector('#experience-gallery h2');
  if (galleryHeading) {
    galleryHeading.textContent = trans.campExperiences;
  }
  
  const gallerySubheading = document.querySelector('#experience-gallery p.lead');
  if (gallerySubheading) {
    gallerySubheading.textContent = trans.realPhotosShared;
  }
  
  // Share photos button
  const shareBtn = document.querySelector('[data-bs-target="#sharePhotoModal"]');
  if (shareBtn) {
    shareBtn.textContent = trans.shareYourExperiencePhotos;
  }
}

// Translate CTA section
function translateCTASection(lang, trans) {
  // CTA heading
  const ctaHeading = document.querySelector('#cta h2');
  if (ctaHeading) {
    ctaHeading.textContent = trans.readyToGive;
  }
  
  const ctaSubheading = document.querySelector('#cta p.lead');
  if (ctaSubheading) {
    ctaSubheading.textContent = trans.registrationOpen;
  }
  
  // CTA buttons
  const ctaBtns = document.querySelectorAll('#cta .btn');
  if (ctaBtns.length >= 2) {
    ctaBtns[0].textContent = trans.registerNow;
    ctaBtns[1].textContent = trans.contactUs;
  }
}

// Translate modal content
function translateModalContent(lang, trans) {
  // Photo sharing modal
  const modalTitle = document.querySelector('#sharePhotoModalLabel');
  if (modalTitle) {
    modalTitle.textContent = trans.shareYourCamp;
  }
  
  // Form elements
  const photoLabel = document.querySelector('label[for="photoUpload"]');
  if (photoLabel) {
    photoLabel.textContent = trans.selectPhoto;
  }
  
  const photoFeedback = document.querySelector('#photoUpload + .invalid-feedback');
  if (photoFeedback) {
    photoFeedback.textContent = trans.pleaseSelectPhoto;
  }
  
  const campNameLabel = document.querySelector('label[for="campName"]');
  if (campNameLabel) {
    campNameLabel.textContent = trans.campName;
  }
  
  const campNameInput = document.querySelector('#campName');
  if (campNameInput) {
    campNameInput.setAttribute('placeholder', trans.campNamePlaceholder);
  }
  
  const campNameFeedback = document.querySelector('#campName + .invalid-feedback');
  if (campNameFeedback) {
    campNameFeedback.textContent = trans.provideCampName;
  }
  
  const descLabel = document.querySelector('label[for="photoDescription"]');
  if (descLabel) {
    descLabel.textContent = trans.briefDescription;
  }
  
  const descTextarea = document.querySelector('#photoDescription');
  if (descTextarea) {
    descTextarea.setAttribute('placeholder', trans.tellAboutMoment);
  }
  
  const descFeedback = document.querySelector('#photoDescription + .invalid-feedback');
  if (descFeedback) {
    descFeedback.textContent = trans.provideBriefDesc;
  }
  
  const consentLabel = document.querySelector('label[for="shareConsent"]');
  if (consentLabel) {
    consentLabel.textContent = trans.consentShare;
  }
  
  const consentFeedback = document.querySelector('#shareConsent + .invalid-feedback');
  if (consentFeedback) {
    consentFeedback.textContent = trans.mustAgree;
  }
  
  // Modal buttons
  const cancelBtn = document.querySelector('#sharePhotoModal .btn-secondary');
  if (cancelBtn) {
    cancelBtn.textContent = trans.cancel;
  }
  
  const submitBtn = document.querySelector('#sharePhotoModal .btn-primary');
  if (submitBtn) {
    submitBtn.textContent = trans.sharePhoto;
  }
} 