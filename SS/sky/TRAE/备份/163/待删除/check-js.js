const fs = require('fs');
const path = require('path');

// 读取HTML文件
const htmlContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

// 提取所有<script>标签内容
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
let match;
let scriptIndex = 0;

while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const scriptContent = match[1];
    scriptIndex++;
    
    try {
        // 尝试解析JavaScript代码
        new Function(scriptContent);
        console.log(`Script ${scriptIndex}: 语法正确`);
    } catch (error) {
        console.error(`Script ${scriptIndex}: 语法错误:`);
        console.error(error.message);
        
        // 显示错误附近的代码
        const lines = scriptContent.split('\n');
        const errorLine = error.stack.match(/at line (\d+)/);
        if (errorLine) {
            const lineNum = parseInt(errorLine[1]);
            const startLine = Math.max(0, lineNum - 5);
            const endLine = Math.min(lines.length, lineNum + 5);
            
            console.error(`错误位置: 第 ${lineNum} 行`);
            for (let i = startLine; i < endLine; i++) {
                const prefix = i === lineNum - 1 ? '>>> ' : '    ';
                console.error(`${prefix}${i + 1}: ${lines[i]}`);
            }
        }
        
        console.error('\n------------------------\n');
    }
}