const mongoose = require('mongoose');
const Program = require('./models/Program');

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Vmflstm!2@cluster0.mw1qigu.mongodb.net/education-camps?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateProgramImages() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    
    // 각 프로그램별 고유 이미지 URL 매핑 (프로그램 특성에 맞는 고유 이미지)
    const programImages = {
      '음악 밴드 캠프': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/music_band_camp_2g0e672g0e672g0e_x0qj1i.png',
      '유소년 풋볼 캠프': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/youth_football_camp_3h1f783h1f783h1f_y1rk2j.png',
      'iDTech STEM 캠프': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/idtech_stem_camp_4i2g894i2g894i2g_z2sl3k.png',
      'iDTech STEM 캠프 Academies': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/idtech_academies_5j3h905j3h905j3h_a3tm4l.png',
      'Play-well LEGO Full Day Session': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/lego_camp_6k4i016k4i016k4i_b4un5m.png',
      'Y Break Camp': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/y_break_camp_7l5j127l5j127l5j_c5vo6n.png',
      'Montessori School Camp': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/montessori_camp_8m6k238m6k238m6k_d6wp7o.png',
      'Advanced Mathematics': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/math_camp_9n7l349n7l349n7l_e7xq8p.png',
      '애틀란타 대학 캠퍼스 & 시티 투어': 'https://res.cloudinary.com/dnry0kzyv/image/upload/v1758940545/atlanta_tour_0o8m450o8m450o8m_f8yr9q.png'
    };
    
    // 모든 프로그램 조회
    const programs = await Program.find({});
    console.log(`📊 총 ${programs.length}개 프로그램 발견`);
    
    // 각 프로그램의 이미지 업데이트
    for (const program of programs) {
      const imageUrl = programImages[program.title];
      
      if (imageUrl) {
        program.photos = [imageUrl];
        await program.save();
        console.log(`✅ ${program.title} 이미지 업데이트 완료`);
        console.log(`   - 새 이미지: ${imageUrl}`);
      } else {
        console.log(`⚠️ ${program.title}에 대한 이미지 URL을 찾을 수 없음`);
      }
    }
    
    console.log('\n🎉 모든 프로그램 이미지 업데이트 완료!');
    
    // 업데이트된 프로그램들 확인
    console.log('\n📋 업데이트된 프로그램 이미지 목록:');
    const updatedPrograms = await Program.find({});
    updatedPrograms.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title}`);
      console.log(`   - 이미지: ${program.photos[0]}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 MongoDB 연결 종료');
  }
}

updateProgramImages();
