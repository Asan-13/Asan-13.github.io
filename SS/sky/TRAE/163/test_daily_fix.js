// 测试每天特定时间点模式的修复
const now = new Date();
console.log(`当前时间: ${now.toLocaleString('zh-CN')}`);

// 模拟任务数据 - 包含当前时间的事件
const testTask = {
    name: "测试事件",
    recurrence: {
        type: "daily",
        subType: "time-points",
        startTimes: ["08:00", "08:15", "08:30", "09:00"], // 包含当前时间正在进行的事件
        duration: 30,
        durationUnit: "minute"
    },
    priority: "medium",
    displayThreshold: 60,
    displayThresholdUnit: "minute"
};

// 测试任务数据 - 有startDate且在过去
const testTaskWithPastStartDate = {
    ...testTask,
    name: "有过去startDate的测试事件",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7天前
};

// 测试任务数据 - 有startDate且在未来
const testTaskWithFutureStartDate = {
    ...testTask,
    name: "有未来startDate的测试事件",
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2天后
};

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

// 测试修复后的getNextOccurrence逻辑
function testNextOccurrence(task, now) {
    console.log(`\n测试任务: ${task.name}`);
    console.log(`时间点: ${task.recurrence.startTimes.join(', ')}`);
    
    // 对时间点进行排序（模拟修复后的逻辑）
    const startTimes = [...task.recurrence.startTimes].sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
    });
    console.log(`排序后的时间点: ${startTimes.join(', ')}`);
    
    // 模拟修复后的检查逻辑
    const baseDate = new Date(now);
    baseDate.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(baseDate);
    let foundEvent = null;
    
    // 检查当天的时间点
    for (const timeStr of startTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const eventTime = new Date(checkDate);
        eventTime.setHours(hours, minutes, 0, 0);
        
        const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
        
        // 检查是否正在进行中
        if (now >= eventTime && now < eventTime.getTime() + durationMs) {
            foundEvent = {
                status: "ongoing",
                startTime: eventTime,
                endTime: new Date(eventTime.getTime() + durationMs)
            };
            break;
        }
        
        // 检查是否是未来时间点
        if (eventTime > now && !foundEvent) {
            foundEvent = {
                status: "upcoming",
                startTime: eventTime,
                endTime: new Date(eventTime.getTime() + durationMs)
            };
        }
    }
    
    if (foundEvent) {
        console.log(`找到的事件: ${foundEvent.status}`);
        console.log(`开始时间: ${foundEvent.startTime.toLocaleTimeString('zh-CN')}`);
        console.log(`结束时间: ${foundEvent.endTime.toLocaleTimeString('zh-CN')}`);
    } else {
        console.log("没有找到符合条件的事件");
    }
    
    return foundEvent;
}

// 修改测试函数以处理startDate
function testNextOccurrence(task, now) {
    console.log(`\n测试任务: ${task.name}`);
    if (task.startDate) {
        console.log(`开始日期: ${new Date(task.startDate).toLocaleDateString('zh-CN')}`);
    }
    console.log(`时间点: ${task.recurrence.startTimes.join(', ')}`);
    
    // 对时间点进行排序（模拟修复后的逻辑）
    const startTimes = [...task.recurrence.startTimes].sort((a, b) => {
        const [aHours, aMinutes] = a.split(':').map(Number);
        const [bHours, bMinutes] = b.split(':').map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
    });
    console.log(`排序后的时间点: ${startTimes.join(', ')}`);
    
    // 模拟修复后的检查逻辑
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // 确定基准日期
    let baseDate = today;
    if (task.startDate) {
        const taskStartDate = new Date(task.startDate);
        taskStartDate.setHours(0, 0, 0, 0);
        // 如果task.startDate在未来，使用它作为基准日期
        if (taskStartDate > today) {
            baseDate = taskStartDate;
        }
    }
    
    console.log(`基准日期: ${baseDate.toLocaleDateString('zh-CN')}`);
    
    let checkDate = new Date(baseDate);
    let foundEvent = null;
    
    // 检查当天的时间点
    for (const timeStr of startTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const eventTime = new Date(checkDate);
        eventTime.setHours(hours, minutes, 0, 0);
        
        const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
        
        // 检查是否正在进行中
        if (now >= eventTime && now < eventTime.getTime() + durationMs) {
            foundEvent = {
                status: "ongoing",
                startTime: eventTime,
                endTime: new Date(eventTime.getTime() + durationMs)
            };
            break;
        }
        
        // 检查是否是未来时间点
        if (eventTime > now && !foundEvent) {
            foundEvent = {
                status: "upcoming",
                startTime: eventTime,
                endTime: new Date(eventTime.getTime() + durationMs)
            };
        }
    }
    
    if (foundEvent) {
        console.log(`找到的事件: ${foundEvent.status}`);
        console.log(`开始时间: ${foundEvent.startTime.toLocaleTimeString('zh-CN')}`);
        console.log(`结束时间: ${foundEvent.endTime.toLocaleTimeString('zh-CN')}`);
    } else {
        console.log("没有找到符合条件的事件");
    }
    
    return foundEvent;
}

// 测试getTaskStatus逻辑
function testGetTaskStatus(task, now) {
    console.log(`\n测试getTaskStatus逻辑:`);
    
    // 先获取下一个事件
    const nextOccurrence = testNextOccurrence(task, now);
    
    if (!nextOccurrence) {
        console.log("无法获取下一个事件");
        return null;
    }
    
    const nextStart = nextOccurrence.startTime;
    const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
    const endTime = nextOccurrence.endTime;
    
    const thresholdMs = convertToMilliseconds(task.displayThreshold, task.displayThresholdUnit);
    const displayStartTime = new Date(nextStart.getTime() - thresholdMs);
    const displayEndTime = endTime;
    
    const isOngoing = now >= nextStart && now < endTime;
    const isInDisplayRange = now >= displayStartTime && now <= displayEndTime;
    
    console.log(`isOngoing: ${isOngoing}`);
    console.log(`isInDisplayRange: ${isInDisplayRange}`);
    
    if (isOngoing) {
        return {
            status: "ongoing",
            timeText: "正在进行",
            startTime: nextStart,
            endTime: endTime
        };
    } else if (isInDisplayRange) {
        return {
            status: "upcoming",
            timeText: "即将开始",
            startTime: nextStart,
            endTime: endTime
        };
    } else {
        return {
            status: "future",
            timeText: "未开始",
            startTime: nextStart,
            endTime: endTime
        };
    }
}

// 运行所有测试用例
console.log("\n=== 测试1: 基本测试 ===");
const result1 = testNextOccurrence(testTask, now);
const statusResult1 = testGetTaskStatus(testTask, now);
if (statusResult1) {
    console.log(`任务状态: ${statusResult1.status}`);
    console.log(`状态文本: ${statusResult1.timeText}`);
}

console.log("\n=== 测试2: 有过去startDate的测试 ===");
const result2 = testNextOccurrence(testTaskWithPastStartDate, now);
const statusResult2 = testGetTaskStatus(testTaskWithPastStartDate, now);
if (statusResult2) {
    console.log(`任务状态: ${statusResult2.status}`);
    console.log(`状态文本: ${statusResult2.timeText}`);
}

console.log("\n=== 测试3: 有未来startDate的测试 ===");
const result3 = testNextOccurrence(testTaskWithFutureStartDate, now);
const statusResult3 = testGetTaskStatus(testTaskWithFutureStartDate, now);
if (statusResult3) {
    console.log(`任务状态: ${statusResult3.status}`);
    console.log(`状态文本: ${statusResult3.timeText}`);
}

console.log(`\n=== 所有测试完成 ===`);