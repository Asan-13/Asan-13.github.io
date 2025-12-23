// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    const multipliers = {
        'minute': 60000,
        'hour': 3600000,
        'day': 86400000,
        'week': 604800000,
        'month': 2592000000,
        'year': 31536000000
    };
    return (value || 0) * (multipliers[unit] || 1);
}

// 模拟getNextOccurrence函数（每月模式部分）
function getNextOccurrence(task, now = new Date()) {
    if (!task || !task.recurrence) {
        return null;
    }
    
    const startTime = task.startTime || "00:00";
    const [startHour, startMinute] = startTime.split(":").map(Number);
    
    // 每月模式
    if (task.recurrence.type === "monthly") {
        // 按日期重复
        if (task.recurrence.days && task.recurrence.days.length > 0) {
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
            
            console.log(`计算空间站事件: 当前日期 ${currentYear}-${currentMonth+1}-${currentDate}`);
            
            // 检查是否有customTimes
            if (task.recurrence.customTimes && task.recurrence.customTimes.length > 0) {
                // 处理特定时间点模式
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
                            console.log(`空间站事件正在进行中: ${eventTime}`);
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
                    console.log(`找到未来空间站事件: ${closestFutureTime}`);
                    return {
                        startTime: closestFutureTime,
                        location: null
                    };
                }
            } else {
                // 处理默认时间点模式
                // 首先检查今天是否是空间站日期
                if (sortedDays.includes(currentDate)) {
                    const todayEvent = new Date(currentYear, currentMonth, currentDate, startHour, startMinute);
                    
                    // 如果当前时间在事件持续时间内
                    if (now >= todayEvent && now < todayEvent.getTime() + durationMs) {
                        console.log(`空间站事件正在进行中: ${todayEvent}`);
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
                            console.log(`找到本月空间站事件: ${candidate}`);
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
                        console.log(`找到下月空间站事件: ${candidate}`);
                        return {
                            startTime: candidate,
                            location: null
                        };
                    }
                }
            }
        }
    }
    
    return null;
}

// 测试用例 - 专门测试每月模式的customTimes功能
const tests = [
    {
        name: "测试1：每月模式 - 单个customTime，当前日期之前",
        task: {
            startDate: "2025-12-01",
            startTime: "09:00",
            recurrence: {
                type: "monthly",
                days: [5],
                customTimes: ["10:00"],
                duration: 1,
                durationUnit: "hour"
            }
        },
        now: new Date("2025-12-03T08:00:00"),
        expectedDate: "2025-12-05",
        expectedTime: "10:00",
        description: "测试单个customTime，当前日期之前，应返回本月的下一个日期和时间点"
    },
    {
        name: "测试2：每月模式 - 多个customTimes，当前日期之前",
        task: {
            startDate: "2025-12-01",
            startTime: "09:00",
            recurrence: {
                type: "monthly",
                days: [5],
                customTimes: ["10:00", "14:00", "18:00"],
                duration: 1,
                durationUnit: "hour"
            }
        },
        now: new Date("2025-12-05T09:00:00"),
        expectedDate: "2025-12-05",
        expectedTime: "10:00",
        description: "测试多个customTimes，当前日期之前，应返回本月的下一个日期和第一个时间点"
    },
    {
        name: "测试3：每月模式 - 多个customTimes，当前时间点之间",
        task: {
            startDate: "2025-12-01",
            startTime: "09:00",
            recurrence: {
                type: "monthly",
                days: [5],
                customTimes: ["10:00", "14:00", "18:00"],
                duration: 1,
                durationUnit: "hour"
            }
        },
        now: new Date("2025-12-05T12:00:00"),
        expectedDate: "2025-12-05",
        expectedTime: "14:00",
        description: "测试多个customTimes，当前时间点之间，应返回当天的下一个时间点"
    },
    {
        name: "测试4：每月模式 - 多个customTimes，当前时间点之后",
        task: {
            startDate: "2025-12-01",
            startTime: "09:00",
            recurrence: {
                type: "monthly",
                days: [5],
                customTimes: ["10:00", "14:00", "18:00"],
                duration: 1,
                durationUnit: "hour"
            }
        },
        now: new Date("2025-12-05T20:00:00"),
        expectedDate: "2026-01-05",
        expectedTime: "10:00",
        description: "测试多个customTimes，当前时间点之后，应返回下月的第一个时间点"
    },
    {
        name: "测试5：每月模式 - 多个customTimes，多个日期",
        task: {
            startDate: "2025-12-01",
            startTime: "09:00",
            recurrence: {
                type: "monthly",
                days: [5, 15, 25],
                customTimes: ["10:00", "14:00"],
                duration: 1,
                durationUnit: "hour"
            }
        },
        now: new Date("2025-12-03T08:00:00"),
        expectedDate: "2025-12-05",
        expectedTime: "10:00",
        description: "测试多个customTimes，多个日期，应返回第一个日期的第一个时间点"
    },
    {
        name: "测试6：每月模式 - 事件正在进行中",
        task: {
            startDate: "2025-12-01",
            startTime: "09:00",
            recurrence: {
                type: "monthly",
                days: [5],
                customTimes: ["10:00", "14:00"],
                duration: 2,
                durationUnit: "hour"
            }
        },
        now: new Date("2025-12-05T10:30:00"),
        expectedDate: "2025-12-05",
        expectedTime: "10:00",
        description: "测试事件正在进行中，应返回正在进行的事件时间"
    }
];

// 运行测试
function runTests() {
    console.log("每月模式customTimes测试结果\n");
    let passCount = 0;
    let failCount = 0;
    
    tests.forEach((test, index) => {
        try {
            const result = getNextOccurrence(test.task, test.now);
            const resultDate = result ? result.startTime.toISOString().split('T')[0] : null;
            const resultTime = result ? result.startTime.toISOString().split('T')[1].slice(0, 5) : null;
            const expectedDate = test.expectedDate;
            const expectedTime = test.expectedTime;
            const passed = resultDate === expectedDate && resultTime === expectedTime;
            
            if (passed) {
                passCount++;
            } else {
                failCount++;
            }
            
            console.log(`测试 ${index + 1}: ${test.name}`);
            console.log(`描述: ${test.description}`);
            console.log(`当前时间: ${test.now.toISOString()}`);
            console.log(`预期: ${expectedDate} ${expectedTime}`);
            console.log(`实际: ${resultDate} ${resultTime}`);
            console.log(`结果: ${passed ? '✓ 通过' : '✗ 失败'}`);
            console.log("---");
            
        } catch (error) {
            failCount++;
            console.log(`测试 ${index + 1}: ${test.name}`);
            console.log(`描述: ${test.description}`);
            console.log(`错误: ${error.message}`);
            console.log(`结果: ✗ 失败`);
            console.log("---");
        }
    });
    
    console.log(`\n测试总结`);
    console.log(`通过: ${passCount}`);
    console.log(`失败: ${failCount}`);
    console.log(`总测试数: ${tests.length}`);
    console.log(`成功率: ${((passCount / tests.length) * 100).toFixed(2)}%`);
}

// 运行测试
runTests();