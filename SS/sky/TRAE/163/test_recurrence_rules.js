// 测试重复模式规则
console.log('=== 重复模式规则测试 ===\n');

// 模拟当前时间
const now = new Date(2025, 11, 21, 10, 30); // 2025-12-21 10:30:00
console.log(`当前时间: ${now.toLocaleString('zh-CN')}\n`);

// 测试用例1: 每天固定时间重复 - 单次
const dailySingle = {
    id: "daily-single",
    name: "每天单次测试",
    startTime: "12:00",
    recurrence: {
        type: "daily",
        subType: "time-points",
        startTimes: ["12:00"],
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例2: 每天固定时间重复 - 多点
const dailyMultiple = {
    id: "daily-multiple",
    name: "每天多点测试",
    startTime: "10:00",
    recurrence: {
        type: "daily",
        subType: "time-points",
        startTimes: ["10:00", "15:00"],
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例3: 每天间隔循环重复
const dailyInterval = {
    id: "daily-interval",
    name: "每天间隔测试",
    startTime: "09:00",
    recurrence: {
        type: "daily",
        subType: "time-range",
        rangeStart: "09:00",
        rangeEnd: "23:00",
        intervalCount: 1,
        intervalUnit: "hour",
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例4: 每周固定时间重复 - 单天单次
const weeklySingle = {
    id: "weekly-single",
    name: "每周单天单次测试",
    startTime: "20:00",
    recurrence: {
        type: "weekly",
        subType: "time-points",
        weekdays: [6], // 周六
        startTimes: ["20:00"],
        duration: 60,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例5: 每周固定时间重复 - 多天多点
const weeklyMultiple = {
    id: "weekly-multiple",
    name: "每周多天多点测试",
    startTime: "12:00",
    recurrence: {
        type: "weekly",
        subType: "time-points",
        weekdays: [1, 2], // 周一、周二
        startTimes: ["12:00", "15:00"],
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例6: 每周间隔循环重复
const weeklyInterval = {
    id: "weekly-interval",
    name: "每周间隔测试",
    startTime: "09:00",
    recurrence: {
        type: "weekly",
        subType: "time-range",
        weekdays: [1, 2], // 周一、周二
        rangeStart: "09:00",
        rangeEnd: "22:00",
        intervalCount: 1,
        intervalUnit: "hour",
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例7: 每月固定时间重复 - 单日单次
const monthlySingle = {
    id: "monthly-single",
    name: "每月单日单次测试",
    startTime: "12:00",
    recurrence: {
        type: "monthly",
        subType: "time-points",
        days: [5], // 每月5号
        startTimes: ["12:00"],
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例8: 每月固定时间重复 - 多日多点
const monthlyMultiple = {
    id: "monthly-multiple",
    name: "每月多日多点测试",
    startTime: "12:00",
    recurrence: {
        type: "monthly",
        subType: "time-points",
        days: [10, 20], // 每月10号、20号
        startTimes: ["12:00", "18:00"],
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例9: 每月间隔循环重复
const monthlyInterval = {
    id: "monthly-interval",
    name: "每月间隔测试",
    startTime: "09:00",
    recurrence: {
        type: "monthly",
        subType: "time-range",
        days: [1], // 每月1号
        rangeStart: "09:00",
        rangeEnd: "18:00",
        intervalCount: 1,
        intervalUnit: "hour",
        duration: 30,
        durationUnit: "minute"
    },
    priority: "none"
};

// 测试用例数组
const testCases = [
    dailySingle,
    dailyMultiple,
    dailyInterval,
    weeklySingle,
    weeklyMultiple,
    weeklyInterval,
    monthlySingle,
    monthlyMultiple,
    monthlyInterval
];

// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    const conversions = {
        "minute": 60 * 1000,
        "hour": 60 * 60 * 1000,
        "day": 24 * 60 * 60 * 1000,
        "week": 7 * 24 * 60 * 60 * 1000,
        "month": 30 * 24 * 60 * 60 * 1000
    };
    return value * conversions[unit] || 0;
}

// 简化版的getNextOccurrence函数，用于测试
function testNextOccurrence(task, now) {
    console.log(`\n--- 测试用例: ${task.name} ---`);
    console.log(`类型: ${task.recurrence.type}`);
    console.log(`子类型: ${task.recurrence.subType || "默认"}`);
    
    if (task.recurrence.subType === "time-points") {
        console.log(`开始时间: ${task.recurrence.startTimes.join(', ')}`);
    } else if (task.recurrence.subType === "time-range") {
        console.log(`时间范围: ${task.recurrence.rangeStart}-${task.recurrence.rangeEnd}`);
        console.log(`间隔: 每${task.recurrence.intervalCount}${task.recurrence.intervalUnit}`);
    }
    
    // 这里将调用实际的getNextOccurrence函数
    // 实际测试时可以替换为真实调用
    console.log("预期结果: 待实现");
    console.log("实际结果: 待实现");
}

// 执行测试
for (const testCase of testCases) {
    testNextOccurrence(testCase, now);
}

console.log('\n=== 测试完成 ===');
