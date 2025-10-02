const https = require('https');
const http = require('http');

// 검색엔진에 사이트맵 제출하는 스크립트
class SearchEngineSubmitter {
  constructor(domain) {
    this.domain = domain;
    this.sitemapUrl = `${domain}/sitemap.xml`;
  }

  // 구글 서치 콘솔에 사이트맵 제출 (수동으로 해야 함)
  // https://search.google.com/search-console
  submitToGoogle() {
    console.log('🔍 구글 서치 콘솔에 사이트맵 제출:');
    console.log(`   URL: ${this.sitemapUrl}`);
    console.log('   방법: https://search.google.com/search-console 접속 후 사이트맵 제출');
  }

  // 네이버 웹마스터 도구에 사이트맵 제출 (수동으로 해야 함)
  // https://searchadvisor.naver.com
  submitToNaver() {
    console.log('🔍 네이버 웹마스터 도구에 사이트맵 제출:');
    console.log(`   URL: ${this.sitemapUrl}`);
    console.log('   방법: https://searchadvisor.naver.com 접속 후 사이트맵 제출');
  }

  // 빙 웹마스터 도구에 사이트맵 제출 (수동으로 해야 함)
  // https://www.bing.com/webmasters
  submitToBing() {
    console.log('🔍 빙 웹마스터 도구에 사이트맵 제출:');
    console.log(`   URL: ${this.sitemapUrl}`);
    console.log('   방법: https://www.bing.com/webmasters 접속 후 사이트맵 제출');
  }

  // ping 서비스로 검색엔진에 알림 (자동화 가능)
  pingSearchEngines() {
    const pingUrls = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(this.sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(this.sitemapUrl)}`
    ];

    pingUrls.forEach(url => {
      this.pingUrl(url);
    });
  }

  pingUrl(url) {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      console.log(`✅ Ping 성공: ${url} (상태: ${res.statusCode})`);
    }).on('error', (err) => {
      console.log(`❌ Ping 실패: ${url} (오류: ${err.message})`);
    });
  }

  // 새로운 페이지가 추가되었을 때 실행할 함수
  notifyNewContent(pageUrl) {
    console.log(`📢 새로운 콘텐츠 알림: ${pageUrl}`);
    
    // 사이트맵 ping
    this.pingSearchEngines();
    
    // 추가 알림 방법들
    console.log('💡 추가 권장사항:');
    console.log('   1. 소셜 미디어에 공유');
    console.log('   2. 관련 사이트에 링크');
    console.log('   3. RSS 피드 업데이트');
  }
}

// 사용 예시
if (require.main === module) {
  const submitter = new SearchEngineSubmitter('https://yourdomain.com');
  
  console.log('🚀 검색엔진 제출 가이드');
  console.log('========================');
  
  submitter.submitToGoogle();
  console.log('');
  submitter.submitToNaver();
  console.log('');
  submitter.submitToBing();
  console.log('');
  
  console.log('🔄 자동 Ping 테스트:');
  submitter.pingSearchEngines();
}

module.exports = SearchEngineSubmitter;
