// 简单的测试脚本，验证修复后的getNextOccurrence函数

// 模拟时区转换（关闭时区转换，直接返回原始时间）
const TimeZoneUtils = {
    PDTtoCST: function(date) {
        return new Date(date.getTime());
    },
    CSTtoPDT: function(date) {
        return new Date(date.getTime());
    }
};

// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    const conversions = {
        'minutes': 60 * 1000,
        'hours': 60 * 60 * 1000,
        'days': 24 * 60 * 60 * 1000
    };
    return value * (conversions[unit] || 1000);
}

// 修复后的getNextOccurrence函数（只保留daily部分）
function getNextOccurrence(task, nowCST) {
    // 创建nowPDT变量表示当前时间（这里不做时区转换）
    const nowPDT = TimeZoneUtils.CSTtoPDT(nowCST);

    if (task.recurrence.type === "daily") {
        // 每天重复
        // 获取所有时间点，如果没有则使用默认时间
        const timePoints = task.recurrence.startTimes && task.recurrence.startTimes.length > 0 ? 
            task.recurrence.startTimes.map(timeStr => {
                const [h, m] = timeStr.split(':').map(Number);
                return { hour: h, minute: m };
            }) : [{ hour: 10, minute: 0 }];
        
        // 计算今天和明天的所有时间点组合
        const today = new Date(nowPDT);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const candidates = [];
        
        // 检查今天的所有时间点
        for (const { hour, minute } of timePoints) {
            const testDatePDT = new Date(today);
            testDatePDT.setHours(hour, minute, 0, 0);
            if (testDatePDT > nowPDT) {
                candidates.push(testDatePDT);
            }
        }
        
        // 如果今天没有找到合适的时间点，检查明天的所有时间点
        if (candidates.length === 0) {
            for (const { hour, minute } of timePoints) {
                const testDatePDT = new Date(tomorrow);
                testDatePDT.setHours(hour, minute, 0, 0);
                candidates.push(testDatePDT);
            }
        }
        
        // 选择最近的时间点
        candidates.sort((a, b) => a - b);
        
        // 检查是否正在进行中（需要检查所有时间点，包括今天已经发生过的时间点）
        const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
        
        // 首先检查今天的所有时间点（包括已经发生过的），看是否有正在进行中的事件
        for (const { hour, minute } of timePoints) {
            const testDatePDT = new Date(today);
            testDatePDT.setHours(hour, minute, 0, 0);
            const candidateCST = TimeZoneUtils.PDTtoCST(testDatePDT);
            
            console.log(`\n检查时间点: ${hour}:${minute}`);
            console.log(`开始时间: ${candidateCST}`);
            console.log(`当前时间: ${nowCST}`);
            console.log(`结束时间: ${new Date(candidateCST.getTime() + durationMs)}`);
            
            if (candidateCST <= nowCST && nowCST < candidateCST.getTime() + durationMs) {
                console.log(`✅ 找到正在进行的事件！`);
                return {
                    startTime: candidateCST,
                    location: ""
                };
            }
        }
        
        // 如果没有正在进行中的事件，返回最近的时间点
        console.log(`\n❌ 没有找到正在进行的事件，返回最近的时间点: ${candidates[0]}`);
        const nextTimeCST = TimeZoneUtils.PDTtoCST(candidates[0]);
        return {
            startTime: nextTimeCST,
            location: ""
        };
    }

    return null;
}

// 创建测试任务：每天10:00、14:00、18:00重复，持续3小时
const testTask = {
    recurrence: {
        type: "daily",
        startTimes: ["10:00", "14:00", "18:00"],
        duration: 3,
        durationUnit: "hours"
    }
};

// 测试不同的当前时间
console.log("=== 测试1：当前时间是12:00（应该显示10:00-13:00的事件正在进行） ===");
const now1 = new Date(2023, 11, 12, 12, 0, 0, 0);
const result1 = getNextOccurrence(testTask, now1);
console.log(`结果：${result1 ? result1.startTime : "null"}`);

console.log("\n=== 测试2：当前时间是15:00（应该显示14:00-17:00的事件正在进行） ===");
const now2 = new Date(2023, 11, 12, 15, 0, 0, 0);
const result2 = getNextOccurrence(testTask, now2);
console.log(`结果：${result2 ? result2.startTime : "null"}`);

console.log("\n=== 测试3：当前时间是19:00（应该显示18:00-21:00的事件正在进行） ===");
const now3 = new Date(2023, 11, 12, 19, 0, 0, 0);
const result3 = getNextOccurrence(testTask, now3);
console.log(`结果：${result3 ? result3.startTime : "null"}`);

console.log("\n=== 测试4：当前时间是9:00（应该显示10:00的事件即将开始） ===");
const now4 = new Date(2023, 11, 12, 9, 0, 0, 0);
const result4 = getNextOccurrence(testTask, now4);
console.log(`结果：${result4 ? result4.startTime : "null"}`);

console.log("\n=== 测试5：当前时间是13:30（应该显示14:00的事件即将开始） ===");
const now5 = new Date(2023, 11, 12, 13, 30, 0, 0);
const result5 = getNextOccurrence(testTask, now5);
console.log(`结果：${result5 ? result5.startTime : "null"}`);

console.log("\n=== 测试6：当前时间是22:00（应该显示明天10:00的事件即将开始） ===");
const now6 = new Date(2023, 11, 12, 22, 0, 0, 0);
const result6 = getNextOccurrence(testTask, now6);
console.log(`结果：${result6 ? result6.startTime : "null"}`);