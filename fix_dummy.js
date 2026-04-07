const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Remove old dummy
db.issues = db.issues.filter(issue => issue.issueNumber <= 2);
db.articles = db.articles.filter(article => {
  const issueNumberMatch = article.issueId.match(/issue-(\d+)/);
  if(!issueNumberMatch) return true;
  return parseInt(issueNumberMatch[1], 10) <= 2;
});

const newDummies = [
  { num: 3, title: "낯선 단어들", theme: "우리의 언어가 만나는 곳", desc: "남쪽에서 배운 새로운 단어들은 우리에게 또 다른 창이 되었습니다." },
  { num: 4, title: "기억의 조각", theme: "단편적인 기억을 이어 붙이기", desc: "잊고 싶었던, 혹은 잊을 수 없는 그날의 기억을 꺼내어 놓습니다." },
  { num: 5, title: "경계선 위에서", theme: "두 가지 정체성", desc: "이쪽에도, 저쪽에도 온전히 속하지 못했던 불안함에 대하여." },
  { num: 6, title: "나를 부르는 이름", theme: "새로운 이름표 쓰기", desc: "새로운 곳에서 얻은 나의 이름. 그 이름이 가진 의미를 찾아가는 과정." },
  { num: 7, title: "식탁의 풍경", theme: "위로가 되는 음식들", desc: "고향 어머니가 해주시던 음식, 그리고 내가 처음 만들어 본 남쪽의 요리." },
  { num: 8, title: "학교 가는 길", theme: "다르지만 같은 10대", desc: "모든 것이 서툴렀던 학교 생활. 그 속에서 만난 소중한 친구들." },
  { num: 9, title: "부치지 못한 편지", theme: "어딘가에 닿기를 바라는 마음", desc: "고향에 있는 가족에게, 혹은 과거의 나에게 보내는 편지." },
  { num: 10, title: "작은 용기", theme: "내일을 향한 첫 걸음", desc: "나를 세상에 드러내기 위해 냈던 작은 용기들에 대한 기록." },
  { num: 11, title: "계절의 변화", theme: "두 번의 봄을 맞이하며", desc: "달라진 공기와 온도, 그리고 새롭게 맞이하는 계절에 대한 단상." },
  { num: 12, title: "우리의 꿈", theme: "내일의 이야기를 짓다", desc: "작가, 프로그래머, 요리사... 저마다의 가슴에 품은 우리의 크고 작은 꿈들." }
];

const articlesData = [
  { t: 'interview', title: "내가 가장 좋아하는 단어", author: "은별 (17세)" },
  { t: 'story', title: "잊고 싶은, 그리고 간직하고 싶은 날", author: "강산 (16세)" },
  { t: 'review', title: "책 속에서 찾은 나의 모습", author: "우리 (15세)" }
];

newDummies.forEach(data => {
  const issueId = `issue-${String(data.num).padStart(3, '0')}`;
  db.issues.push({
    id: issueId,
    issueNumber: data.num,
    title: data.title,
    theme: data.theme,
    editorNote: `[편집자 노트] ${data.desc}\n\n우리는 글을 통해 각자의 경험을 공유하고 위로를 받습니다. 이번 호에서는 이 주제를 깊이 있게 담아냈습니다.\n\n- 편집자 일동`,
    isPublished: true,
    publishedAt: new Date(2026, data.num % 12, 1).toISOString(),
    createdAt: new Date(2026, (data.num - 1) % 12, 1).toISOString(),
    coverImage: "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?auto=format&fit=crop&q=80"
  });

  articlesData.forEach((art, i) => {
    db.articles.push({
      id: `article-${data.num}00${i+1}`,
      issueId: issueId,
      type: art.t,
      title: `${art.title}`,
      content: `[${data.title} 호 이야기]\n\n내가 처음 이곳에 와서 느꼈던 감정은 한마디로 표현하기 어려웠습니다. 매일매일 새로운 것들의 연속이었으니까요. 하지만 글쓰기 수업을 통해 내 마음을 들여다보고, 그것들을 단어로 옮기면서 조금씩 안정을 찾아갔습니다.\n\n이 글은 나와 비슷한 경험을 한 친구들에게 들려주고 싶은 이야기입니다. 우리는 혼자가 아니라는 것을 알려주고 싶어요.`,
      authorName: art.author,
      displayOrder: i+1,
      createdAt: new Date(2026, data.num % 12, 2).toISOString(),
      views: Math.floor(Math.random() * 500)
    });
  });
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Dummy data replaced with project-relevant content.');
