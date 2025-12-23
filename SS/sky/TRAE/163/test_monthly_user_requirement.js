// 测试用户要求的每月模式功能
// 验证：
// 1. 每月特定日期的特定时间点
// 2. 每月特定日期的时间段间隔

// 模拟转换函数
function convertToMilliseconds(value, unit) {
    const multipliers = {
        "minute": 60 * 1000,
        "hour": 60 * 60 * 1000,
        "day": 24 * 60 * 60 * 1000,
        "week": 7 * 24 * 60 * 60 * 1000
    };
    return value * (multipliers[unit] || multipliers["minute"]);
}

// 重新设计的每月重复模式处理函数
function getNextOccurrence(task, now = new Date()) {
    try {
        // 处理每月重复模式
        if (task.recurrence.type === "monthly") {
            // 确保days数组存在且不为空
            if (!task.recurrence.days || task.recurrence.days.length === 0) {
                return null;
            }
            
            // 对days数组进行排序，确保按数值顺序查找下一个日期
            const sortedDays = [...task.recurrence.days].sort((a, b) => a - b);
            const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
            
            // 确定起始日期，优先使用task.startDate（如果是未来日期）
            let today = new Date(now);
            if (task.startDate) {
                const taskStartDate = new Date(task.startDate);
                taskStartDate.setHours(0, 0, 0, 0);
                
                // 如果任务的startDate是未来日期，使用它作为起始日期
                const currentDateOnly = new Date(now);
                currentDateOnly.setHours(0, 0, 0, 0);
                
                if (taskStartDate > currentDateOnly) {
                    today = taskStartDate;
                }
            }
            
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const currentDate = today.getDate();
            
            console.log(`计算每月事件: 当前日期 ${currentYear}-${currentMonth+1}-${currentDate}`);
            
            // 获取子模式，默认为date
            const subType = task.recurrence.subType || "date";
            
            // 处理不同的子模式
            switch (subType) {
                case "time-points":
                    // 每月特定时间点模式
                    return handleMonthlyTimePoints(task, now, sortedDays, durationMs, currentYear, currentMonth, currentDate);
                case "time-range":
                    // 每月时间段间隔模式
                    return handleMonthlyTimeRange(task, now, sortedDays, durationMs, currentYear, currentMonth, currentDate);
                case "date":
                default:
                    // 每月特定日期模式
                    return handleMonthlyDate(task, now, sortedDays, durationMs, currentYear, currentMonth, currentDate);
            }
        }
        
        // 每月特定日期模式处理函数
        function handleMonthlyDate(task, now, sortedDays, durationMs, currentYear, currentMonth, currentDate) {
            // 解析任务的默认开始时间
            const startTime = task.startTime || '00:00';
            const [startHour, startMinute] = startTime.split(':').map(Number);
            
            // 首先检查今天是否是事件日期
            if (sortedDays.includes(currentDate)) {
                const todayEvent = new Date(currentYear, currentMonth, currentDate, startHour, startMinute);
                
                // 如果当前时间在事件持续时间内
                if (now >= todayEvent && now < todayEvent.getTime() + durationMs) {
                    console.log(`每月事件正在进行中: ${todayEvent}`);
                    return {
                        startTime: todayEvent,
                        location: null
                    };
                }
            }
            
            // 检查今天之后的日期
            for (const day of sortedDays) {
                if (day > currentDate) {
                    const candidate = new Date(currentYear, currentMonth, day, startHour, startMinute);
                    if (candidate.getMonth() === currentMonth) {
                        console.log(`找到本月事件: ${candidate}`);
                        return {
                            startTime: candidate,
                            location: null
                        };
                    }
                }
            }
            
            // 如果本月没有符合条件的日期了，找下个月
            const nextMonth = currentMonth + 1;
            const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
            const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
            
            for (const day of sortedDays) {
                const candidate = new Date(nextYear, adjustedMonth, day, startHour, startMinute);
                if (candidate.getMonth() === adjustedMonth) {
                    console.log(`找到下月事件: ${candidate}`);
                    return {
                        startTime: candidate,
                        location: null
                    };
                }
            }
            
            return null;
        }
        
        // 每月特定时间点模式处理函数
        function handleMonthlyTimePoints(task, now, sortedDays, durationMs, currentYear, currentMonth, currentDate) {
            // 确保customTimes存在且不为空
            if (!task.recurrence.customTimes || task.recurrence.customTimes.length === 0) {
                return null;
            }
            
            const customTimes = task.recurrence.customTimes;
            let closestFutureTime = null;
            
            // 1. 检查当前月份和日期的所有时间点
            for (const day of sortedDays) {
                // 对于当前月份，只处理今天及以后的日期
                if (day < currentDate) continue;
                
                for (const timeStr of customTimes) {
                    const [timeHour, timeMinute] = timeStr.split(':').map(Number);
                    const eventTime = new Date(currentYear, currentMonth, day, timeHour, timeMinute);
                    
                    // 检查日期是否有效
                    if (eventTime.getMonth() !== currentMonth) continue;
                    
                    // 检查是否正在进行中
                    if (now >= eventTime && now < eventTime.getTime() + durationMs) {
                        console.log(`每月事件正在进行中: ${eventTime}`);
                        return {
                            startTime: eventTime,
                            location: null
                        };
                    }
                    
                    // 找到最早的未来时间点
                    if (eventTime > now && (!closestFutureTime || eventTime < closestFutureTime)) {
                        closestFutureTime = eventTime;
                    }
                }
            }
            
            // 2. 如果当前月份没有找到未来时间点，检查下一个月份
            if (!closestFutureTime) {
                const nextMonth = currentMonth + 1;
                const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
                const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
                
                for (const day of sortedDays) {
                    for (const timeStr of customTimes) {
                        const [timeHour, timeMinute] = timeStr.split(':').map(Number);
                        const eventTime = new Date(nextYear, adjustedMonth, day, timeHour, timeMinute);
                        
                        // 检查日期是否有效
                        if (eventTime.getMonth() === adjustedMonth) {
                            // 找到最早的未来时间点
                            if (!closestFutureTime || eventTime < closestFutureTime) {
                                closestFutureTime = eventTime;
                            }
                        }
                    }
                }
            }
            
            // 如果找到未来时间点，返回它
            if (closestFutureTime) {
                console.log(`找到未来每月事件: ${closestFutureTime}`);
                return {
                    startTime: closestFutureTime,
                    location: null
                };
            }
            
            return null;
        }
        
        // 每月时间段间隔模式处理函数
        function handleMonthlyTimeRange(task, now, sortedDays, durationMs, currentYear, currentMonth, currentDate) {
            // 确保时间段参数存在
            if (!task.recurrence.rangeStart || !task.recurrence.rangeEnd) {
                return null;
            }
            
            const rangeStart = task.recurrence.rangeStart;
            const rangeEnd = task.recurrence.rangeEnd;
            const intervalCount = task.recurrence.intervalCount || 1;
            const intervalUnit = task.recurrence.intervalUnit || "hour";
            const intervalMs = convertToMilliseconds(intervalCount, intervalUnit);
            
            let closestFutureTime = null;
            
            // 1. 解析时间段的开始和结束时间
            const [rangeStartHour, rangeStartMinute] = rangeStart.split(':').map(Number);
            const [rangeEndHour, rangeEndMinute] = rangeEnd.split(':').map(Number);
            
            // 2. 检查当前月份和日期的所有时间段
            for (const day of sortedDays) {
                // 对于当前月份，只处理今天及以后的日期
                if (day < currentDate) continue;
                
                // 创建当天的时间段开始时间
                const rangeStartTime = new Date(currentYear, currentMonth, day, rangeStartHour, rangeStartMinute);
                const rangeEndTime = new Date(currentYear, currentMonth, day, rangeEndHour, rangeEndMinute);
                
                // 检查日期是否有效
                if (rangeStartTime.getMonth() !== currentMonth) continue;
                
                // 3. 计算当天内所有符合条件的时间点
                let tempTime = new Date(rangeStartTime);
                
                // 如果是今天，从当前时间向前查找最近的间隔点，以确保不会错过今天的任何时间点
                if (day === currentDate) {
                    // 计算从rangeStartTime到now之间的所有间隔点
                    let checkTime = new Date(rangeStartTime);
                    while (checkTime <= now) {
                        // 检查是否正在进行中
                        if (now >= checkTime && now < checkTime.getTime() + durationMs) {
                            console.log(`每月事件正在进行中: ${checkTime}`);
                            return {
                                startTime: checkTime,
                                location: null
                            };
                        }
                        // 移动到下一个间隔点
                        checkTime = new Date(checkTime.getTime() + intervalMs);
                    }
                    // 设置tempTime为now之后的第一个间隔点
                    tempTime = checkTime;
                }
                
                // 继续查找未来的时间点
                while (tempTime <= rangeEndTime) {
                    // 找到最早的未来时间点
                    if (tempTime > now && (!closestFutureTime || tempTime < closestFutureTime)) {
                        closestFutureTime = tempTime;
                        // 一旦找到当天最早的未来时间点，就可以跳出循环
                        break;
                    }
                    
                    // 计算下一个间隔时间点
                    tempTime = new Date(tempTime.getTime() + intervalMs);
                }
            }
            
            // 4. 如果当前月份没有找到未来时间点，检查下一个月份
            if (!closestFutureTime) {
                const nextMonth = currentMonth + 1;
                const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
                const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
                
                for (const day of sortedDays) {
                    // 创建当天的时间段开始时间
                    const rangeStartTime = new Date(nextYear, adjustedMonth, day, rangeStartHour, rangeStartMinute);
                    const rangeEndTime = new Date(nextYear, adjustedMonth, day, rangeEndHour, rangeEndMinute);
                    
                    // 检查日期是否有效
                    if (rangeStartTime.getMonth() !== adjustedMonth) continue;
                    
                    // 返回下个月最早的时间段开始时间
                    if (!closestFutureTime || rangeStartTime < closestFutureTime) {
                        closestFutureTime = rangeStartTime;
                    }
                }
            }
            
            // 如果找到未来时间点，返回它
            if (closestFutureTime) {
                console.log(`找到未来每月事件: ${closestFutureTime}`);
                return {
                    startTime: closestFutureTime,
                    location: null
                };
            }
            
            return null;
        }
    } catch (error) {
        console.error("计算下一个事件时间时出错:", error);
        return null;
    }
    return null;
}

// 测试用例 1: 每月特定日期的特定时间点
// 每月的1,3,4号的01:00,06:00进行事件
console.log("=== 测试用例 1: 每月特定日期的特定时间点 ===");
const task1 = {
    name: "每月特定时间点事件",
    recurrence: {
        type: "monthly",
        subType: "time-points",
        days: [1, 3, 4],
        customTimes: ["01:00", "06:00"],
        duration: 30,
        durationUnit: "minute"
    },
    startTime: "00:00"
};

// 测试当前时间是12月2日，应返回12月3日的01:00
const now1 = new Date(2025, 11, 2, 12, 0, 0); // 本地时间 2025-12-02 12:00:00
const result1 = getNextOccurrence(task1, now1);
console.log(`当前时间: ${now1.toLocaleString()}`);
console.log(`预期结果: 2025-12-03 01:00:00`);
console.log(`实际结果: ${result1 ? result1.startTime.toLocaleString() : "null"}`);
console.log(`测试结果: ${result1 && result1.startTime.getDate() === 3 && result1.startTime.getHours() === 1 ? "✓ 通过" : "✗ 失败"}`);

// 测试用例 2: 每月特定日期的时间段间隔
// 每月1,3,4号的08:00到14:00之间每1小时间隔进行一次事件
console.log("\n=== 测试用例 2: 每月特定日期的时间段间隔 ===");
const task2 = {
    name: "每月时间段间隔事件",
    recurrence: {
        type: "monthly",
        subType: "time-range",
        days: [1, 3, 4],
        rangeStart: "08:00",
        rangeEnd: "14:00",
        intervalCount: 1,
        intervalUnit: "hour",
        duration: 30,
        durationUnit: "minute"
    },
    startTime: "00:00"
};

// 测试当前时间是12月3日的10:30，应返回12月3日的11:00
const now2 = new Date(2025, 11, 3, 10, 30, 0); // 本地时间 2025-12-03 10:30:00
const result2 = getNextOccurrence(task2, now2);
console.log(`当前时间: ${now2.toLocaleString()}`);
console.log(`预期结果: 2025-12-03 11:00:00`);
console.log(`实际结果: ${result2 ? result2.startTime.toLocaleString() : "null"}`);
console.log(`测试结果: ${result2 && result2.startTime.getDate() === 3 && result2.startTime.getHours() === 11 ? "✓ 通过" : "✗ 失败"}`);

// 测试用例 3: 事件正在进行中
// 测试当前时间是12月3日的09:15，应返回正在进行的事件
console.log("\n=== 测试用例 3: 事件正在进行中 ===");
const now3 = new Date(2025, 11, 3, 9, 15, 0); // 本地时间 2025-12-03 09:15:00
const result3 = getNextOccurrence(task2, now3);
console.log(`当前时间: ${now3.toLocaleString()}`);
console.log(`预期结果: 2025-12-03 09:00:00 (正在进行)`);
console.log(`实际结果: ${result3 ? result3.startTime.toLocaleString() : "null"}`);
console.log(`测试结果: ${result3 && result3.startTime.getDate() === 3 && result3.startTime.getHours() === 9 ? "✓ 通过" : "✗ 失败"}`);
