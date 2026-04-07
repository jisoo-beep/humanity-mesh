const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

for(let i=3; i<=12; i++) {
  const issueId = `issue-${String(i).padStart(3, '0')}`;
  db.issues.push({
    id: issueId,
    issueNumber: i,
    title: `더미 매거진 호 #${i}`,
    theme: `테마 ${i}: 새로운 관점과 이야기`,
    editorNote: `이것은 생성된 더미 매거진 ${i}호의 편집자 노트입니다.\n\n다양한 관점에서 쓰여진 글들을 읽어보세요.`,
    isPublished: true,
    publishedAt: new Date(2025, i, 1).toISOString(),
    createdAt: new Date(2025, i-1, 1).toISOString()
  });

  for(let j=1; j<=3; j++) {
    db.articles.push({
      id: `article-${i}00${j}`,
      issueId: issueId,
      type: j === 1 ? "interview" : (j === 2 ? "story" : "review"),
      title: `${i}호 ${j === 1 ? '인터뷰' : (j === 2 ? '이야기' : '리뷰')} 기사`,
      content: `이것은 더미 기사의 내용입니다. 매거진 ${i}호에 포함된 글입니다.`,
      authorName: `작가 ${Math.floor(Math.random() * 100)}`,
      displayOrder: j,
      createdAt: new Date(2025, i, 2).toISOString(),
      views: Math.floor(Math.random() * 500)
    });
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Added 10 dummy issues and associated articles.');
