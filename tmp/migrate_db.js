const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const allArticles = [];
db.issues.forEach(issue => {
    if (issue.articles) {
        issue.articles.forEach(article => {
            allArticles.push(article);
        });
        delete issue.articles;
    }
});

db.articles = allArticles;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Migration complete');
