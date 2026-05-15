const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const adminRoutes = getAllFiles('src/app/api/admin').filter(f => f.endsWith('route.ts'));

let changedCount = 0;

for (const file of adminRoutes) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Add imports if missing
  if (!content.includes('getServerSession')) {
    content = content.replace('import { prisma } from "@/lib/prisma";', 'import { prisma } from "@/lib/prisma";\nimport { getServerSession } from "next-auth";\nimport { authOptions } from "@/lib/auth";');
  }

  // Inject auth check into all GET, POST, PATCH, DELETE, PUT
  const methods = ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'];
  for (const method of methods) {
      const regex = new RegExp(`(export\\s+async\\s+function\\s+${method}\\([^)]*\\)\\s*\\{)`, 'g');
      if (regex.test(content)) {
          // Check if already injected
          if (!content.includes(`if (session?.user?.role !== "ADMIN")`)) {
             content = content.replace(regex, `$1\n  const session = await getServerSession(authOptions);\n  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized Admin" }, { status: 401 });\n`);
          }
      }
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
    changedCount++;
  }
}

console.log("Total admin files fixed: " + changedCount);
