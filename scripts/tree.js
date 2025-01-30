const fs = require("fs");
const path = require("path");

function generateTree(startPath, prefix = "") {
  let tree = "";
  const files = fs
    .readdirSync(startPath)
    .filter((file) => !file.startsWith(".") && file !== "node_modules");

  files.forEach((file, index) => {
    const filePath = path.join(startPath, file);
    const isLast = index === files.length - 1;
    const stats = fs.statSync(filePath);

    tree += `${prefix}${isLast ? "└── " : "├── "}${file}\n`;

    if (stats.isDirectory()) {
      tree += generateTree(filePath, prefix + (isLast ? "    " : "│   "));
    }
  });

  return tree;
}

const treeOutput = "subscription-tracker/\n" + generateTree(process.cwd());
console.log(treeOutput);

// Save to file
fs.writeFileSync("project-structure.txt", treeOutput);
