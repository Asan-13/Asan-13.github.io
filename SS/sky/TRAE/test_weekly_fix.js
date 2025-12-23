// 简化的时区处理，直接使用CST时间以避免混淆
const TimeZoneUtils = {
    // 直接返回相同时间，不进行时区转换
    PDTtoCST: function(pdtDate) {
        return new Date(pdtDate);
    },
    // 直接返回相同时间，不进行时区转换
    CSTtoPDT: function(cstDate) {
        return new Date(cstDate);
    },
    // 格式化CST时间
    formatCSTTime: function(cstDate) {
        return `${cstDate.getHours().toString().padStart(2, '0')}:${cstDate.getMinutes().toString().padStart(2, '0')}`;
    }
};

// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    const units = {
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000 // 近似值
    };
    return value * (units[unit] || units.minute);
}

// 模拟getNextOccurrence函数（修复版本）
function getNextOccurrence(task, nowCST) {
    try {
        // 获取开始时间（太平洋时间）
        let startTimeStr = task.startTime;
        // 对于daily、weekly和monthly类型的任务，使用recurrence.startTimes中的第一个时间
        if (!startTimeStr && task.recurrence.startTimes && task.recurrence.startTimes.length > 0) {
            startTimeStr = task.recurrence.startTimes[0];
        }
        // 对于monthly类型的任务，使用recurrence.startTime（兼容旧格式）
        if (!startTimeStr && task.recurrence.startTime) {
            startTimeStr = task.recurrence.startTime;
        }
        // 默认时间为00:00
        startTimeStr = startTimeStr || "00:00";
        
        let startHour, startMinute;
        
        // 确保startTimeStr是字符串
        if (startTimeStr instanceof Date) {
            // 如果是Date对象，先转换为PDT时间，然后再提取小时和分钟
            const pdtDate = TimeZoneUtils.CSTtoPDT(startTimeStr);
            startHour = pdtDate.getHours();
            startMinute = pdtDate.getMinutes();
        } else {
            // 如果是字符串，直接解析
            const [h, m] = startTimeStr.split(':').map(Number);
            startHour = h;
            startMinute = m;
        }
        
        // 获取开始日期
        let startDateStr = task.startDate;
        // 默认日期为当前日期
        startDateStr = startDateStr || new Date().toISOString().split('T')[0];
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        
        // 创建nowPDT变量表示当前太平洋时间
        const nowPDT = TimeZoneUtils.CSTtoPDT(nowCST);
        
        if (task.recurrence.type === "weekly") {
            // 每周重复
            const todayWeekday = nowPDT.getDay();
            
            // 获取所有时间点，如果没有则使用当前的startHour和startMinute
            const timePoints = (task.recurrence.weeklyRepeatType === "time-points" && task.recurrence.startTimes && task.recurrence.startTimes.length > 0) ? 
                task.recurrence.startTimes.map(timeStr => {
                    const [h, m] = timeStr.split(':').map(Number);
                    return { hour: h, minute: m };
                }) : [{ hour: startHour, minute: startMinute }];
            
            // 非间隔重复的情况
            const candidates = [];
            const allTimePoints = []; // 用于检查正在进行中的事件的所有时间点
            
            // 检查未来7天内的所有符合条件的星期几和时间点组合
            for (let i = 0; i < 7; i++) {
                const checkDay = (todayWeekday + i) % 7;
                if (task.recurrence.weekdays.includes(checkDay)) {
                    if (task.recurrence.weeklyRepeatType === "time-range" && task.recurrence.rangeStart) {
                        // time-range模式，使用rangeStart作为时间点
                        const [rangeStartHour, rangeStartMinute] = task.recurrence.rangeStart.split(':').map(Number);
                        const testDatePDT = new Date(nowPDT);
                        testDatePDT.setDate(testDatePDT.getDate() + i);
                        testDatePDT.setHours(rangeStartHour, rangeStartMinute, 0, 0);
                        
                        allTimePoints.push(testDatePDT);
                        if (testDatePDT > nowPDT) {
                            candidates.push(testDatePDT);
                        }
                    } else {
                        // time-points模式或其他，使用所有时间点
                        for (const { hour, minute } of timePoints) {
                            const testDatePDT = new Date(nowPDT);
                            testDatePDT.setDate(testDatePDT.getDate() + i);
                            testDatePDT.setHours(hour, minute, 0, 0);
                            
                            allTimePoints.push(testDatePDT);
                            if (testDatePDT > nowPDT) {
                                candidates.push(testDatePDT);
                            }
                        }
                    }
                }
            }
            
            // 计算持续时间
            let durationMs;
            if (task.recurrence.weeklyRepeatType === "time-range" && task.recurrence.rangeStart && task.recurrence.rangeEnd) {
                // 对于time-range模式，计算rangeStart和rangeEnd之间的时长
                const [rangeStartHour, rangeStartMinute] = task.recurrence.rangeStart.split(':').map(Number);
                const [rangeEndHour, rangeEndMinute] = task.recurrence.rangeEnd.split(':').map(Number);
                const rangeStartMinutes = rangeStartHour * 60 + rangeStartMinute;
                const rangeEndMinutes = rangeEndHour * 60 + rangeEndMinute;
                const rangeDurationMinutes = rangeEndMinutes >= rangeStartMinutes ? rangeEndMinutes - rangeStartMinutes : 1440 + rangeEndMinutes - rangeStartMinutes;
                durationMs = rangeDurationMinutes * 60 * 1000;
            } else {
                // 其他情况使用原来的duration计算
                durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
            }
            
            // 首先检查所有时间点（包括今天已经过去的时间点），看是否有正在进行中的事件
            for (const timePoint of allTimePoints) {
                const timePointCST = TimeZoneUtils.PDTtoCST(timePoint);
                if (timePointCST <= nowCST && nowCST < timePointCST.getTime() + durationMs) {
                    return {
                        startTime: timePointCST,
                        location: ""
                    };
                }
            }
            
            // 如果没有正在进行中的事件，选择最近的未来时间点
            if (candidates.length > 0) {
                candidates.sort((a, b) => a - b);
                
                // 如果candidates数组中有今天的时间点，优先选择今天的
                // 否则选择第一个时间点
                const nextTimeCST = TimeZoneUtils.PDTtoCST(candidates[0]);
                return {
                    startTime: nextTimeCST,
                    location: ""
                };
            }
            
            // 如果没有找到合适的时间点，返回当前时间后的第一个星期几的时间点
            let nextTimePDT = new Date(nowPDT);
            nextTimePDT.setHours(startHour, startMinute, 0, 0);
            return {
                startTime: TimeZoneUtils.PDTtoCST(nextTimePDT),
                location: ""
            };
        }
    } catch (error) {
        console.error("Error in getNextOccurrence:", error);
        return null;
    }
}

// 测试场景：每周五和周六08:00开始的事件，当前时间为周五10:00
console.log("测试场景：每周五和周六08:00开始的事件，当前时间为周五10:00");

// 创建测试任务
const testTask = {
    startTime: "08:00",
    startDate: "2023-10-13",
    recurrence: {
        type: "weekly",
        weekdays: [5, 6], // 周五和周六
        duration: 12, // 12小时持续时间
        durationUnit: "hour",
        weeklyRepeatType: "time-points",
        startTimes: ["08:00"]
    }
};

// 模拟当前时间为周五10:00 CST
// 注意：JavaScript中，0表示周日，1表示周一，以此类推，5表示周五
const nowCST = new Date(2023, 9, 13, 10, 0, 0); // 2023年10月13日周五10:00 CST
console.log("当前时间（CST）：", nowCST.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));

// 调用修复后的getNextOccurrence函数
const nextOccurrence = getNextOccurrence(testTask, nowCST);

if (nextOccurrence) {
    console.log("下一次事件开始时间（CST）：", nextOccurrence.startTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    
    // 检查是否返回了今天的周五
    const isToday = nextOccurrence.startTime.getDate() === nowCST.getDate() && 
                   nextOccurrence.startTime.getMonth() === nowCST.getMonth() && 
                   nextOccurrence.startTime.getFullYear() === nowCST.getFullYear();
    const isFriday = nextOccurrence.startTime.getDay() === 5; // 5表示周五
    
    if (isToday && isFriday) {
        console.log("✓ 测试通过：系统返回了今天的周五08:00开始的事件");
    } else {
        console.log("✗ 测试失败：系统没有返回今天的周五事件");
    }
} else {
    console.log("✗ 测试失败：没有找到下一次事件");
}

// 测试场景2：当前时间超过持续时间
console.log("\n测试场景2：当前时间超过持续时间");
const nowCST2 = new Date(2023, 9, 13, 22, 0, 0); // 2023年10月13日周五22:00 CST（超过12小时持续时间）
console.log("当前时间（CST）：", nowCST2.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));

const nextOccurrence2 = getNextOccurrence(testTask, nowCST2);
if (nextOccurrence2) {
    console.log("下一次事件开始时间（CST）：", nextOccurrence2.startTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    
    // 检查是否返回了明天的周六
    const isSaturday = nextOccurrence2.startTime.getDay() === 6; // 6表示周六
    const isTomorrow = nextOccurrence2.startTime.getDate() === nowCST2.getDate() + 1;
    
    if (isTomorrow && isSaturday) {
        console.log("✓ 测试通过：系统返回了明天的周六08:00开始的事件");
    } else {
        console.log("✗ 测试失败：系统没有返回明天的周六事件");
    }
} else {
    console.log("✗ 测试失败：没有找到下一次事件");
}