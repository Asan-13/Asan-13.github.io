const fs = require('fs');
const path = require('path');

// 读取HTML文件
const htmlContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

// 提取第4个脚本标签内容
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
const scripts = [];
let match;

while ((match = scriptRegex.exec(htmlContent)) !== null) {
    scripts.push(match[1]);
}

if (scripts.length >= 4) {
    const fourthScript = scripts[3];
    
    // 检查括号匹配
    function checkBrackets(code) {
        const stack = [];
        const brackets = {
            '(': ')',
            '{': '}',
            '[': ']'
        };
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            
            // 忽略字符串中的括号
            if (char === '"' || char === "'") {
                const quote = char;
                let j = i + 1;
                while (j < code.length && code[j] !== quote) {
                    if (code[j] === '\\') {
                        j++;
                    }
                    j++;
                }
                i = j;
                continue;
            }
            
            // 忽略注释中的括号
            if (char === '/' && code[i + 1] === '/') {
                let j = i + 2;
                while (j < code.length && code[j] !== '\n') {
                    j++;
                }
                i = j;
                continue;
            }
            
            if (char === '/' && code[i + 1] === '*') {
                let j = i + 2;
                while (j < code.length - 1 && !(code[j] === '*' && code[j + 1] === '/')) {
                    j++;
                }
                i = j + 1;
                continue;
            }
            
            // 检查开括号
            if (brackets[char]) {
                stack.push({ char, index: i });
            }
            // 检查闭括号
            else if (Object.values(brackets).includes(char)) {
                if (stack.length === 0) {
                    return { error: `Unmatched closing bracket '${char}' at index ${i}` };
                }
                
                const last = stack.pop();
                if (brackets[last.char] !== char) {
                    return { error: `Mismatched brackets: '${last.char}' at ${last.index} and '${char}' at ${i}` };
                }
            }
        }
        
        if (stack.length > 0) {
            const last = stack.pop();
            return { error: `Unclosed bracket '${last.char}' started at index ${last.index}` };
        }
        
        return { success: true };
    }
    
    const result = checkBrackets(fourthScript);
    if (result.success) {
        console.log('所有括号匹配正确');
    } else {
        console.error('括号匹配错误:', result.error);
        
        // 找到错误位置附近的代码
        const errorIndex = parseInt(result.error.match(/\d+/)[0]);
        const startIndex = Math.max(0, errorIndex - 50);
        const endIndex = Math.min(fourthScript.length, errorIndex + 50);
        const context = fourthScript.substring(startIndex, endIndex);
        console.error('错误位置上下文:');
        console.error(context);
    }
} else {
    console.log('HTML文件中只有', scripts.length, '个<script>标签');
}