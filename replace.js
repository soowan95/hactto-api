const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('prisma/schema/**/*.prisma');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace visitorId to userId
  content = content.replace(/visitorId/g, 'userId');
  // Replace @map("visitor_id") to @map("user_id")
  content = content.replace(/visitor_id/g, 'user_id');
  // Replace visitor to user in relation names or type names
  content = content.replace(/visitor\s+Visitor/g, 'user User');
  content = content.replace(/visitor\s+Visitor\?/g, 'user User?');
  content = content.replace(/Visitor/g, 'User');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
