const fs = require('fs');
const path = require('path');

// 读取HTML文件
const htmlContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

// 提取所有<script>标签内容
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
const scripts = [];
let match;

while ((match = scriptRegex.exec(htmlContent)) !== null) {
    scripts.push(match[1]);
}

// 保存第4个脚本到单独文件
if (scripts.length >= 4) {
    const fourthScript = scripts[3];
    fs.writeFileSync(path.join(__dirname, 'fourth-script.js'), fourthScript);
    console.log('第4个脚本已保存到 fourth-script.js');
    
    try {
        // 尝试解析JavaScript代码
        new Function(fourthScript);
        console.log('第4个脚本语法正确');
    } catch (error) {
        console.error('第4个脚本语法错误:', error.message);
        
        // 尝试使用更简单的方法定位错误
        const lines = fourthScript.split('\n');
        console.log('脚本共有', lines.length, '行');
        
        // 逐行检查，尝试找出错误行
        let lineNum = 1;
        for (const line of lines) {
            try {
                new Function(line);
            } catch (lineError) {
                console.error(`可能的错误行 ${lineNum}:`, line.trim());
            }
            lineNum++;
        }
    }
} else {
    console.log('HTML文件中只有', scripts.length, '个<script>标签');
}