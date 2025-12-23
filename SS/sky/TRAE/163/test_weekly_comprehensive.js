// 辅助函数：将时间转换为毫秒
function convertToMilliseconds(value, unit) {
    const conversion = {
        'minute': 60 * 1000,
        'hour': 60 * 60 * 1000,
        'day': 24 * 60 * 60 * 1000,
        'week': 7 * 24 * 60 * 60 * 1000,
        'month': 30 * 24 * 60 * 60 * 1000, // 近似值
        'year': 365 * 24 * 60 * 60 * 1000  // 近似值
    };
    return (value || 1) * (conversion[unit] || conversion['hour']);
}

// 修复后的getNextOccurrence函数
function getNextOccurrence(task, now) {
    try {
        // 处理每周重复
        if (task.recurrence.type === "weekly") {
            // 1. 确定起始日期：使用task.startDate，如果它存在；否则使用当前日期
            let startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            
            if (task.startDate) {
                const taskStartDate = new Date(task.startDate);
                taskStartDate.setHours(0, 0, 0, 0);
                
                // 如果task.startDate在未来，使用它；否则使用当前日期
                // 但始终确保不早于task.startDate
                if (taskStartDate > startDate) {
                    startDate = taskStartDate;
                }
            }
            
            // 2. 找到从startDate开始的下一个符合条件的星期几
            let baseDate = new Date(startDate);
            let found = false;
            
            // 确保weekdays数组有值，如果为空则使用默认值[1]（周一），并将所有元素转换为数字
            const weekdays = task.recurrence.weekdays && task.recurrence.weekdays.length > 0 
                ? task.recurrence.weekdays.map(Number) 
                : [1]; // 默认周一
            
            // 如果有多个星期几，并且startDate本身就是匹配的星期几，我们需要检查下一个匹配的星期几
            const startDateWeekday = startDate.getDay();
            const isStartDateMatch = weekdays.includes(startDateWeekday);
            const hasMultipleWeekdays = weekdays.length > 1;
            
            // 最多检查7天，找到第一个符合条件的星期几
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date(startDate);
                checkDate.setDate(startDate.getDate() + i);
                const checkWeekday = checkDate.getDay();
                
                // 如果是第一个匹配的日期，且startDate本身就是匹配的，并且有多个星期几，那么跳过这个日期，继续查找下一个匹配的
                if (i === 0 && isStartDateMatch && hasMultipleWeekdays) {
                    continue;
                }
                
                if (weekdays.includes(checkWeekday)) {
                    baseDate = checkDate;
                    found = true;
                    break;
                }
            }
            
            // 如果没有找到（理论上不应该发生，因为weekdays数组现在保证有值），默认使用当前日期
            if (!found) {
                baseDate = new Date(startDate);
            }
            
            baseDate.setHours(0, 0, 0, 0);
            const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
            
            // 4. 根据子模式处理时间
            if (task.recurrence.repeatType === 'time-range') {
                // 时间段间隔模式
                const [rangeStartHour, rangeStartMinute] = (task.recurrence.rangeStart || '00:00').split(':').map(Number);
                const [rangeEndHour, rangeEndMinute] = (task.recurrence.rangeEnd || '23:59').split(':').map(Number);
                
                // 计算时间段的开始和结束时间
                const rangeStart = new Date(baseDate);
                rangeStart.setHours(rangeStartHour, rangeStartMinute, 0, 0);
                
                const rangeEnd = new Date(baseDate);
                rangeEnd.setHours(rangeEndHour, rangeEndMinute, 0, 0);
                
                // 计算间隔时间（毫秒）
                const intervalMs = convertToMilliseconds(task.recurrence.intervalCount || 1, task.recurrence.intervalUnit || 'hour');
                
                // 遍历当天的所有时间段
                let currentTime = new Date(rangeStart);
                while (currentTime <= rangeEnd) {
                    // 检查是否正在进行中
                    if (now >= currentTime && now < currentTime.getTime() + durationMs) {
                        return {
                            startTime: currentTime,
                            location: null
                        };
                    }
                    
                    // 检查是否是未来的时间点
                    if (currentTime > now) {
                        return {
                            startTime: currentTime,
                            location: null
                        };
                    }
                    
                    // 增加间隔时间
                    currentTime = new Date(currentTime.getTime() + intervalMs);
                }
                
                // 如果当天没有找到未来的时间点，检查下一个符合条件的星期几
                // 找下一个星期
                const nextWeek = new Date(baseDate);
                nextWeek.setDate(baseDate.getDate() + 7);
                
                // 在下周的同一天设置时间范围的开始时间
                const nextTime = new Date(nextWeek);
                nextTime.setHours(rangeStartHour, rangeStartMinute, 0, 0);
                return {
                    startTime: nextTime,
                    location: null
                };
            } else if (task.recurrence.customTimes && task.recurrence.customTimes.length > 0) {
                // 时间点模式：检查所有时间点
                let closestFutureTime = null;
                
                for (const timeStr of task.recurrence.customTimes) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const timePoint = new Date(baseDate);
                    timePoint.setHours(hours, minutes, 0, 0);
                    
                    // 检查是否正在进行中
                    if (now >= timePoint && now < timePoint.getTime() + durationMs) {
                        return {
                            startTime: timePoint,
                            location: null
                        };
                    }
                    
                    // 找到最早的未来时间点
                    if (timePoint > now && (!closestFutureTime || timePoint < closestFutureTime)) {
                        closestFutureTime = timePoint;
                    }
                }
                
                // 如果找到未来时间点，使用它
                if (closestFutureTime) {
                    return {
                        startTime: closestFutureTime,
                        location: null
                    };
                } else {
                    // 否则使用第一个时间点并移到下周
                    const [hours, minutes] = task.recurrence.customTimes[0].split(':').map(Number);
                    const nextTime = new Date(baseDate);
                    nextTime.setHours(hours, minutes, 0, 0);
                    nextTime.setDate(nextTime.getDate() + 7);
                    return {
                        startTime: nextTime,
                        location: null
                    };
                }
            } else {
                // 默认情况
                const startTime = task.startTime || '00:00';
                const [startHour, startMinute] = startTime.split(':').map(Number);
                const nextTime = new Date(baseDate);
                nextTime.setHours(startHour, startMinute, 0, 0);
                
                // 检查是否正在进行中
                if (now >= nextTime && now < nextTime.getTime() + durationMs) {
                    return {
                        startTime: nextTime,
                        location: null
                    };
                }
                
                // 如果时间已过，移到下周
                if (nextTime <= now) {
                    nextTime.setDate(nextTime.getDate() + 7);
                }
                return {
                    startTime: nextTime,
                    location: null
                };
            }
        }
    } catch (error) {
        console.error("Error in getNextOccurrence:", error);
        return {
            startTime: null,
            location: null
        };
    }
}

// 测试函数
function runTest(testCase) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`当前时间：${testCase.now.toLocaleString()}`);
    console.log(`开始日期：${testCase.task.startDate || '无'}`);
    console.log(`每周几：${testCase.task.recurrence.weekdays}`);
    console.log(`重复类型：${testCase.task.recurrence.repeatType || '默认'}`);
    
    if (testCase.task.recurrence.customTimes) {
        console.log(`时间点：${testCase.task.recurrence.customTimes}`);
    }
    if (testCase.task.recurrence.rangeStart) {
        console.log(`时间段：${testCase.task.recurrence.rangeStart} - ${testCase.task.recurrence.rangeEnd}`);
        console.log(`间隔：${testCase.task.recurrence.intervalCount} ${testCase.task.recurrence.intervalUnit}`);
    }
    
    const result = getNextOccurrence(testCase.task, testCase.now);
    
    if (result.startTime) {
        console.log(`计算结果：${result.startTime.toLocaleString()}`);
        console.log(`计算日期：${result.startTime.toISOString().split('T')[0]}`);
        
        // 验证结果
        const resultDate = result.startTime.toISOString().split('T')[0];
        if (resultDate === testCase.expectedDate) {
            console.log("✅ 测试通过");
            return true;
        } else {
            console.log(`❌ 测试失败：期望日期为${testCase.expectedDate}，实际计算结果为${resultDate}`);
            return false;
        }
    } else {
        console.log("❌ 测试失败：无法计算出下一次发生时间");
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log("=== 每周模式全面测试 ===");
    
    const now = new Date("2025-12-20T15:00:00"); // 当前时间：20日周六15:00
    let passedTests = 0;
    let totalTests = 0;
    
    // 测试用例数组
    const testCases = [
        {
            name: "测试1：字符串形式的weekdays数组",
            task: {
                startDate: "2025-12-22",
                startTime: "10:00",
                recurrence: {
                    type: "weekly",
                    weekdays: ["0"], // 每周日（字符串形式）
                    duration: 1,
                    durationUnit: "hour"
                }
            },
            now: now,
            expectedDate: "2025-12-28"
        },
        {
            name: "测试2：数字形式的weekdays数组",
            task: {
                startDate: "2025-12-22",
                startTime: "10:00",
                recurrence: {
                    type: "weekly",
                    weekdays: [0], // 每周日（数字形式）
                    duration: 1,
                    durationUnit: "hour"
                }
            },
            now: now,
            expectedDate: "2025-12-28"
        },
        {
            name: "测试3：多星期几的情况（周一和周三）",
            task: {
                startDate: "2025-12-22",
                startTime: "10:00",
                recurrence: {
                    type: "weekly",
                    weekdays: [1, 3], // 每周一和周三
                    duration: 1,
                    durationUnit: "hour"
                }
            },
            now: now,
            expectedDate: "2025-12-24"
        },
        {
            name: "测试4：时间点模式",
            task: {
                startDate: "2025-12-22",
                recurrence: {
                    type: "weekly",
                    weekdays: [0], // 每周日
                    customTimes: ["09:00", "14:00", "18:00"], // 多个时间点
                    duration: 30,
                    durationUnit: "minute"
                }
            },
            now: now,
            expectedDate: "2025-12-28"
        },
        {
            name: "测试5：时间段间隔模式",
            task: {
                startDate: "2025-12-22",
                recurrence: {
                    type: "weekly",
                    weekdays: [0], // 每周日
                    repeatType: "time-range",
                    rangeStart: "08:00",
                    rangeEnd: "12:00",
                    intervalCount: 2,
                    intervalUnit: "hour",
                    duration: 1,
                    durationUnit: "hour"
                }
            },
            now: now,
            expectedDate: "2025-12-28"
        },
        {
            name: "测试6：开始日期在过去的情况",
            task: {
                startDate: "2025-12-15", // 过去的日期
                startTime: "10:00",
                recurrence: {
                    type: "weekly",
                    weekdays: [0], // 每周日
                    duration: 1,
                    durationUnit: "hour"
                }
            },
            now: now,
            expectedDate: "2025-12-21"
        },
        {
            name: "测试7：当前时间在事件持续时间内",
            task: {
                startTime: "14:00",
                recurrence: {
                    type: "weekly",
                    weekdays: [6], // 每周六
                    duration: 2,
                    durationUnit: "hour"
                }
            },
            now: new Date("2025-12-20T14:30:00"), // 当前时间：20日周六14:30（在14:00-16:00之间）
            expectedDate: "2025-12-20"
        }
    ];
    
    // 运行所有测试
    for (const testCase of testCases) {
        totalTests++;
        if (runTest(testCase)) {
            passedTests++;
        }
    }
    
    // 显示最终结果
    console.log(`\n=== 测试结果汇总 ===`);
    console.log(`测试总数：${totalTests}`);
    console.log(`通过测试：${passedTests}`);
    console.log(`失败测试：${totalTests - passedTests}`);
    
    if (passedTests === totalTests) {
        console.log("🎉 所有测试通过！");
    } else {
        console.log("😔 部分测试失败！");
    }
}

// 执行所有测试
runAllTests();