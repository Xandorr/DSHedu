console.log('🔥 main.js 파일 로드 시작!');

// ===== 찜하기 기능 (DOMContentLoaded 외부에서 즉시 실행) =====
try {
  console.log('🚀 찜하기 기능 초기화 시작 (즉시 실행)');
  
  // 이벤트 위임을 사용하여 동적으로 추가된 버튼도 처리
  document.addEventListener('click', function(event) {
    const wishlistBtn = event.target.closest('.wishlist-btn');
    
    if (wishlistBtn) {
      console.log('❤️ 찜하기 버튼 클릭됨 (이벤트 위임)');
      console.log('🔍 클릭된 버튼:', wishlistBtn);
      console.log('🔍 프로그램 ID:', wishlistBtn.dataset.programId);
      try {
        handleWishlist(event);
      } catch (error) {
        console.error('❌ handleWishlist 실행 오류:', error);
      }
    }
  });
  
  console.log('✅ 찜하기 이벤트 리스너 등록 완료');
} catch (error) {
  console.error('❌ 찜하기 기능 초기화 오류:', error);
}

// Wait for document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  "use strict";
  console.log('📄 DOMContentLoaded 이벤트 발생!');

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
  const programsSwiper = new Swiper('.program-swiper', {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
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


  // DOM이 완전히 로드된 후 찜 상태 확인
  console.log('🔵 main.js DOMContentLoaded 이벤트 실행됨!');
  
  try {
    console.log('🔵 현재 페이지 URL:', window.location?.href || 'URL 정보 없음');
    console.log('🔵 현재 페이지 title:', document?.title || 'Title 정보 없음');
  } catch (error) {
    console.warn('🔵 페이지 정보 로드 오류:', error);
  }
  
  // 즉시 실행
  console.log('⏰ DOM 로드 확인 시작 - main.js (즉시 실행)');
  console.log('🔍 initializeWishlistStatus 함수 호출 준비');
  
  // 함수 존재 여부 확인
  if (typeof initializeWishlistStatus === 'function') {
    console.log('✅ initializeWishlistStatus 함수 존재 확인');
    initializeWishlistStatus();
  } else {
    console.error('❌ initializeWishlistStatus 함수를 찾을 수 없습니다');
  }
  
  // 추가 보험용 setTimeout
  setTimeout(() => {
    console.log('⏰ DOM 로드 확인 시작 - main.js (1초 후 재시도)');
    if (typeof initializeWishlistStatus === 'function') {
      console.log('✅ 재시도 - initializeWishlistStatus 함수 존재 확인');
      initializeWishlistStatus();
    } else {
      console.error('❌ 재시도 - initializeWishlistStatus 함수를 찾을 수 없습니다');
    }
  }, 1000);

}

// ===== 찜하기 관련 함수들 (전역 스코프) =====

console.log('🔵 main.js 파일 로드됨! 전역 스코프에서 실행 중...');

// 로그인 상태 확인
async function checkLoginStatus() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    return data.isAuthenticated;
  } catch (error) {
    return false;
  }
}

// 모든 찜하기 버튼 상태 초기화
async function initializeWishlistStatus() {
  console.log('🚀 initializeWishlistStatus 함수 시작');
  try {
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    console.log('🔍 찜하기 버튼 개수:', wishlistBtns.length);
    console.log('🔍 찾은 버튼들:', Array.from(wishlistBtns).map(btn => ({
      element: btn,
      programId: btn.dataset.programId,
      className: btn.className
    })));
    
    if (wishlistBtns.length === 0) {
      console.log('❌ 찜하기 버튼이 없어서 종료');
      return;
    }

    console.log('🔐 로그인 상태 확인 중...');
    const isLoggedIn = await checkLoginStatus();
    console.log('🔐 로그인 상태:', isLoggedIn);
    
    if (!isLoggedIn) {
      console.log('👤 비로그인 상태 - 찜 상태 확인 건너뜀');
      return;
    }

    console.log('📡 찜 목록 API 호출 시작...');
    // 모든 찜 목록을 한 번에 가져오기
    const response = await fetch('/api/wishlist/all');
    console.log('📡 API 응답 상태:', response.status);
    const data = await response.json();
    console.log('📡 API 응답 데이터:', data);

    if (data.success) {
      const wishlistedPrograms = data.wishlistedPrograms || [];
      console.log('💖 찜한 프로그램 목록:', wishlistedPrograms);

      // 각 버튼의 상태 업데이트
      wishlistBtns.forEach((btn, index) => {
        const programId = btn.dataset.programId;
        console.log(`🔍 버튼 ${index + 1} - 프로그램 ID: ${programId}`);
        
        if (programId && wishlistedPrograms.includes(programId)) {
          const icon = btn.querySelector('i');
          console.log(`🔍 버튼 ${index + 1} - 아이콘:`, icon);
          if (icon) {
            console.log(`🔍 버튼 ${index + 1} - 변경 전 클래스:`, icon.className);
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#dc3545'; // 빨간색으로 변경
            console.log(`❤️ 찜 상태로 업데이트: ${programId} - 변경 후 클래스:`, icon.className);
          }
          // 버튼 테두리도 빨간색으로 변경
          btn.style.borderColor = '#dc3545';
          btn.style.color = '#dc3545';
        }
      });
    } else {
      console.log('❌ API 응답이 실패:', data);
    }
  } catch (error) {
    console.error('❌ 찜 상태 초기화 오류:', error);
    console.error('❌ 오류 스택:', error.stack);
  }
  console.log('✅ initializeWishlistStatus 함수 종료');
}

// 개별 찜 상태 확인 (기존 함수 유지)
async function checkWishlistStatus(btn) {
  try {
    const programId = btn.dataset.programId;
    if (!programId) return;

    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) return;

    const response = await fetch(`/api/wishlist/check/${programId}`);
    const data = await response.json();

    if (data.success && data.isWishlisted) {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove('far');
        icon.classList.add('fas');
      }
    }
  } catch (error) {
    console.error('찜 상태 확인 오류:', error);
  }
}

// 찜하기 처리 함수
async function handleWishlist(event) {
  console.log('❤️ 찜하기 버튼 클릭됨');
  event.preventDefault();
  
  // 이벤트 위임을 위해 실제 버튼 요소 찾기
  const button = event.target.closest('.wishlist-btn');
  if (!button) return;
  
  const programId = button.dataset.programId;
  const icon = button.querySelector('i');
  const isWishlisted = icon.classList.contains('fas');
  
  console.log('📋 찜하기 정보:', { programId, isWishlisted });

  // 로그인 확인
  const isLoggedIn = await checkLoginStatus();
  if (!isLoggedIn) {
    showToast('로그인이 필요합니다.', 'warning');
    // 현재 페이지 URL을 저장하고 로그인 페이지로 이동
    const currentUrl = window.location.href;
    localStorage.setItem('redirectAfterLogin', currentUrl);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    return;
  }

  try {
    // 버튼 비활성화
    button.disabled = true;

    const method = isWishlisted ? 'DELETE' : 'POST';
    console.log('🔗 API 요청:', method, `/api/enrollments/wishlist/${programId}`);
    
    const response = await fetch(`/api/enrollments/wishlist/${programId}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 응답 상태:', response.status, response.ok);
    const data = await response.json();
    console.log('📋 응답 데이터:', data);

    if (data.success) {
      // 아이콘 상태 변경
      if (isWishlisted) {
        icon.classList.remove('fas');
        icon.classList.add('far');
        // 버튼과 아이콘 색상을 기본값으로 복원
        icon.style.color = '';
        button.style.borderColor = '';
        button.style.color = '';
        showToast('찜 목록에서 제거되었습니다.', 'success');
      } else {
        icon.classList.remove('far');
        icon.classList.add('fas');
        // 버튼과 아이콘을 빨간색으로 변경
        icon.style.color = '#dc3545';
        button.style.borderColor = '#dc3545';
        button.style.color = '#dc3545';
        showToast('찜 목록에 추가되었습니다! 내 등록 현황에서 확인하세요.', 'success');
        // 2초 후 등록 현황 페이지로 이동
        setTimeout(() => {
          window.location.href = '/dashboard/enrollments';
        }, 2000);
      }
    } else {
      showToast(data.message || '오류가 발생했습니다.', 'error');
    }
  } catch (error) {
    console.error('찜하기 오류:', error);
    showToast('네트워크 오류가 발생했습니다.', 'error');
  } finally {
    // 버튼 재활성화
    button.disabled = false;
  }
}

// 토스트 메시지 표시 함수
function showToast(message, type = 'info') {
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toastClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-primary';
  const toastHtml = `
    <div class="toast position-fixed top-0 end-0 m-3" style="z-index: 9999;" role="alert">
      <div class="toast-body ${toastClass} text-white">
        ${message}
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', toastHtml);
  
  // Bootstrap Toast 사용 (없으면 자동 제거)
  try {
    const toast = new bootstrap.Toast(document.querySelector('.toast'));
    toast.show();
  } catch (e) {
    // Bootstrap Toast 없으면 수동으로 제거
    setTimeout(() => {
      const toastElement = document.querySelector('.toast');
      if (toastElement) {
        toastElement.remove();
      }
    }, 3000);
  }
} 