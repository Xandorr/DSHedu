const programs = [
  {
    id: 1,
    title: "iDTech 여름 STEM 캠프",
    description: "미국 아이비리그 학생들이 직접 멘토링하는 1주 기본과정의 최상위 STEM 프로그램에 참여하세요.",
    category: "summer",
    location: "Georgia Tech 또는 Emory University 캠퍼스",
    dateRange: "2025년 7월 10일 - 8월 5일",
    duration: "1주",
    ageRange: "7-17세",
    age: "7-17세",
    originalPrice: "$1,679",
    discountedPrice: "$1,511",
    discountPercent: "10%",
    price: "$1,511부터", // 백워드 호환성을 위해 유지
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    badge: "여름",
    badgeClass: "bg-primary",
    featured: true,
    features: [
      "아이비리그 대학생 멘토링",
      "STEM 집중 기본 교육 프로그램",
      "실험실 실습 활동",
      "조지아텍, 에모리 대학교 캠퍼스에서 진행",
      "영어 몰입 환경"
    ]
  },
  {
    id: 2,
    title: "iDTech 여름 STEM 캠프 Academies",
    description: "미국 아이비리그 학생들이 직접 멘토링하는 2주 심화과정의 최상위 STEM 프로그램에 참여하세요.",
    category: "summer",
    location: "조지아텍, 에모리 대학교 캠퍼스",
    dateRange: "2025년 7월 7일 - 7월 18일",
    duration: "2주",
    ageRange: "15-18세",
    age: "15-18세",
    originalPrice: "$7,466",
    discountedPrice: "$6,719",
    discountPercent: "10%",
    price: "$6,719부터",
    image: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    badge: "여름",
    badgeClass: "bg-primary",
    featured: true,
    features: [
      "아이비리그 대학생 멘토링",
      "STEM 집중 심화 교육 프로그램",
      "실험실 실습 활동",
      "조지아텍, 에모리 대학교 캠퍼스에서 진행",
      "영어 몰입 환경"
    ]
  },
  {
    id: 3,
    title: "iDTech 여름 STEM 캠프",
    description: "미국 아이비리그 학생들이 직접 멘토링하는 1주 기본과정의 최상위 STEM 프로그램에 참여하세요.",
    category: "summer",
    location: "Georgia Tech 또는 Emory University 캠퍼스",
    dateRange: "2025년 7월 10일 - 8월 5일",
    duration: "1주",
    ageRange: "7-17세",
    age: "7-17세",
    originalPrice: "$1,679",
    discountedPrice: "$1,511",
    discountPercent: "10%",
    price: "$1,511부터", // 백워드 호환성을 위해 유지
    image: "https://res.cloudinary.com/dnry0kzyv/image/upload/v1752808299/ChatGPT_Image_Jul_17_2025_11_08_06_PM_g5xdsb.png",
    badge: "여름",
    badgeClass: "bg-primary",
    featured: true,
    features: [
      "아이비리그 대학생 멘토링",
      "STEM 집중 기본 교육 프로그램",
      "실험실 실습 활동",
      "조지아텍, 에모리 대학교 캠퍼스에서 진행",
      "영어 몰입 환경"
    ]
  },
  {
    id: 4,
    title: "iDTech 여름 STEM 캠프 Academies",
    description: "미국 아이비리그 학생들이 직접 멘토링하는 2주 심화과정의 최상위 STEM 프로그램에 참여하세요.",
    category: "summer",
    location: "Georgia Tech 또는 Emory University 캠퍼스",
    dateRange: "2025년 7월 7일 - 7월 18일",
    duration: "2주",
    ageRange: "15-18세",
    age: "15-18세",
    originalPrice: "$7,466",
    discountedPrice: "$6,719",
    discountPercent: "10%",
    price: "$6,719부터",
    image: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    badge: "여름",
    badgeClass: "bg-primary",
    featured: true,
    features: [
      "아이비리그 대학생 멘토링",
      "STEM 집중 심화 교육 프로그램",
      "실험실 실습 활동",
      "조지아텍, 에모리 대학교 캠퍼스에서 진행",
      "영어 몰입 환경"
    ]
  },
  {
    id: 5,
    title: "컬럼비아 여름 예술 캠프",
    description: "뉴욕의 중심에서 예술, 음악, 연극 등 다양한 창의적 활동을 경험하세요.",
    category: "summer",
    location: "뉴욕 맨해튼",
    dateRange: "2025년 7월 15일 - 8월 10일",
    duration: "4주",
    ageRange: "12-16세",
    age: "12-16세",
    originalPrice: "$5,000",
    discountedPrice: "$4,500",
    discountPercent: "10%",
    price: "$4,500",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    badge: "여름",
    badgeClass: "bg-primary",
    featured: true,
    features: [
      "컬럼비아 대학교에서 진행",
      "예술, 음악, 연극 집중 교육",
      "브로드웨이 뮤지컬 관람",
      "뉴욕 예술 명소 방문",
      "창작 작품 발표회"
    ]
  },
  {
    id: 6,
    title: "콜로라도 겨울 스키 & 영어 캠프",
    description: "아름다운 로키 산맥에서 스키나 스노보드를 배우면서 영어 실력을 향상시키세요.",
    category: "winter",
    location: "콜로라도 아스펜",
    dateRange: "2025년 12월 20일 - 2026년 1월 10일",
    duration: "3주",
    ageRange: "10-16세",
    age: "10-16세",
    originalPrice: "$4,667",
    discountedPrice: "$4,200",
    discountPercent: "10%",
    price: "$4,200",
    image: "https://images.unsplash.com/photo-1551524164-687a55dd1126?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    badge: "겨울",
    badgeClass: "bg-info",
    featured: true,
    features: [
      "아스펜 스키 리조트에서 진행",
      "전문 스키/스노보드 강습",
      "영어 집중 수업",
      "눈 액티비티 체험",
      "미국 겨울 문화 체험"
    ]
  },
  {
    id: 7,
    title: "하버드 겨울 아카데믹 캠프",
    description: "아이비리그 명문 하버드 대학교에서 겨울 방학 동안 집중적으로 학업을 진행하세요.",
    category: "winter",
    location: "매사추세츠 캠브리지",
    dateRange: "2025년 12월 28일 - 2026년 1월 18일",
    duration: "3주",
    ageRange: "16-18세",
    age: "16-18세",
    originalPrice: "$5,000",
    discountedPrice: "$4,500",
    discountPercent: "10%",
    price: "$4,500",
    image: "https://images.unsplash.com/photo-1483921026157-4ecdd0d93d5b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    badge: "겨울",
    badgeClass: "bg-info",
    featured: true,
    features: [
      "하버드 대학교 겨울 캠퍼스 체험",
      "집중적인 학술 프로그램",
      "겨울 스포츠 활동",
      "보스턴 겨울 문화 탐방",
      "대학 진학 상담"
    ]
  },
  {
    id: 8,
    title: "유타 겨울 스키 & 영어 캠프",
    description: "세계적으로 유명한 파우더 스노우가 있는 유타에서 스키와 영어를 함께 배우세요.",
    category: "special",
    location: "유타 파크시티",
    dateRange: "2025년 12월 15일 - 2026년 1월 5일",
    duration: "3주",
    ageRange: "12-17세",
    age: "12-17세",
    originalPrice: "$4,333",
    discountedPrice: "$3,900",
    discountPercent: "10%",
    price: "$3,900",
    image: "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    badge: "특별",
    badgeClass: "bg-info",
    featured: true,
    features: [
      "파크시티 스키 리조트에서 진행",
      "세계적인 파우더 스노우 체험",
      "영어 몰입 환경",
      "스키 기술 향상 프로그램",
      "미국 서부 문화 체험"
    ]
  },
  {
    id: 9,
    title: "애틀란타 캠퍼스 & 시티 투어",
    description: "세계적인 대학교인 조지아텍, 에모리 대학교 및 애틀란타 최고의 인기 명소인 조지아 아쿠아리움, 코카콜라 박물관, 식물원 등을 방문하는 프로그램입니다.",
    category: "special",
    location: "애틀란타",
    dateRange: "2025년 7월 19일",
    duration: "주말 하루",
    ageRange: "7-18세",
    age: "7-18세",
    originalPrice: "$800",
    discountedPrice: "$720",
    discountPercent: "10%",
    price: "$720",
    image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    badge: "특별",
    badgeClass: "bg-warning",
    featured: true,
    features: [
      "세계적인 대학교 캠퍼스 투어",
      "애틀란타 최고의 인기 명소 투어",
      "학습 동기부여",
      "미국 문화 체험",
      "영어 학습 이해도 향상"
    ]
  }
];

// Helper functions
const getFeaturedPrograms = () => {
  return programs.filter(program => program.featured);
};

const getProgramsByCategory = (category) => {
  if (category === 'all') return programs;
  return programs.filter(program => program.category === category);
};

const getProgramById = (id) => {
  return programs.find(program => program.id === parseInt(id));
};

module.exports = {
  programs,
  getFeaturedPrograms,
  getProgramsByCategory,
  getProgramById
}; 