// 测试每天模式的显示效果
console.log('=== 每天模式显示测试 ===\n');

// 模拟任务数据 - startTime是Date对象的情况
const dailyTask1 = {
    id: "test1",
    name: "每天测试任务1",
    startTime: new Date(2025, 11, 20, 19, 45), // Date对象
    recurrence: {
        type: "daily",
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 模拟任务数据 - startTime是字符串的情况
const dailyTask2 = {
    id: "test2",
    name: "每天测试任务2",
    startTime: "08:30", // 字符串格式
    recurrence: {
        type: "daily",
        duration: 60,
        durationUnit: "minute"
    },
    priority: "none"
};

// 模拟任务数据 - 有startTimes数组的情况
const dailyTask3 = {
    id: "test3",
    name: "每天测试任务3",
    startTime: "09:00",
    recurrence: {
        type: "daily",
        dailyRepeatType: "time-points",
        startTimes: ["09:00", "12:00", "18:00"],
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 模拟任务数据 - 有时间段间隔的情况
const dailyTask4 = {
    id: "test4",
    name: "每天测试任务4",
    startTime: "08:00",
    recurrence: {
        type: "daily",
        dailyRepeatType: "time-range",
        rangeStart: "08:00",
        rangeEnd: "18:00",
        intervalCount: 1,
        intervalUnit: "hour",
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 模拟createTaskElement函数中的重复信息生成逻辑
function generateRecurrenceText(task) {
    let recurrenceText = "";
    const unitNames = {
        "minute": "分钟",
        "hour": "小时",
        "day": "天",
        "week": "周",
        "month": "月"
    };
    
    switch(task.recurrence.type) {
        case "daily":
        case "daily_times":
            if (task.recurrence.dailyRepeatType === "time-range" && task.recurrence.rangeStart) {
                // 每天 时间段间隔模式: 每天 00:00 每1小时
                recurrenceText = `每天 ${task.recurrence.rangeStart}`;
                if (task.recurrence.intervalCount && task.recurrence.intervalUnit) {
                    recurrenceText += ` 每${task.recurrence.intervalCount}${unitNames[task.recurrence.intervalUnit]}`;
                }
            } else if (task.recurrence.startTimes && task.recurrence.startTimes.length > 0) {
                // 每天 特定时间点模式: 每天 00:00, 02:00
                recurrenceText = `每天 ${task.recurrence.startTimes.join(', ')}`;
            } else if (task.recurrence.customTimes && task.recurrence.customTimes.length > 0) {
                // 兼容旧格式的customTimes
                recurrenceText = `每天 ${task.recurrence.customTimes.join(', ')}`;
            } else {
                // 确保startTime是格式化的时间字符串，不是Date对象
                let displayStartTime = "00:00";
                if (task.startTime) {
                    if (typeof task.startTime === 'string') {
                        displayStartTime = task.startTime;
                    } else if (task.startTime instanceof Date) {
                        // 将Date对象格式化为HH:MM字符串
                        displayStartTime = task.startTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
                    }
                }
                recurrenceText = `每天 ${displayStartTime}`;
            }
            break;
        default:
            recurrenceText = "其他模式";
    }
    
    return recurrenceText;
}

// 执行测试
console.log("📋 测试1：startTime是Date对象的情况");
console.log(`任务名称: ${dailyTask1.name}`);
console.log(`原始startTime: ${dailyTask1.startTime}`);
console.log(`生成的重复文本: ${generateRecurrenceText(dailyTask1)}`);
console.log(`预期结果: 每天 19:45`);
console.log(`测试结果: ${generateRecurrenceText(dailyTask1) === "每天 19:45" ? "✅ 通过" : "❌ 失败"}`);
console.log("---\n");

console.log("📋 测试2：startTime是字符串的情况");
console.log(`任务名称: ${dailyTask2.name}`);
console.log(`原始startTime: ${dailyTask2.startTime}`);
console.log(`生成的重复文本: ${generateRecurrenceText(dailyTask2)}`);
console.log(`预期结果: 每天 08:30`);
console.log(`测试结果: ${generateRecurrenceText(dailyTask2) === "每天 08:30" ? "✅ 通过" : "❌ 失败"}`);
console.log("---\n");

console.log("📋 测试3：有startTimes数组的情况");
console.log(`任务名称: ${dailyTask3.name}`);
console.log(`原始startTimes: ${dailyTask3.recurrence.startTimes}`);
console.log(`生成的重复文本: ${generateRecurrenceText(dailyTask3)}`);
console.log(`预期结果: 每天 09:00, 12:00, 18:00`);
console.log(`测试结果: ${generateRecurrenceText(dailyTask3) === "每天 09:00, 12:00, 18:00" ? "✅ 通过" : "❌ 失败"}`);
console.log("---\n");

console.log("📋 测试4：有时间段间隔的情况");
console.log(`任务名称: ${dailyTask4.name}`);
console.log(`原始rangeStart: ${dailyTask4.recurrence.rangeStart}`);
console.log(`生成的重复文本: ${generateRecurrenceText(dailyTask4)}`);
console.log(`预期结果: 每天 08:00 每1小时`);
console.log(`测试结果: ${generateRecurrenceText(dailyTask4) === "每天 08:00 每1小时" ? "✅ 通过" : "❌ 失败"}`);
console.log("---\n");

console.log('=== 测试完成 ===\n');