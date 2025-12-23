// 综合测试脚本 - 验证每周时间段间隔事件的修复

// 模拟TimeZoneUtils对象
const TimeZoneUtils = {
    // 简单模拟PDT到CST的转换（PDT = CST - 2小时）
    PDTtoCST: function(pdtDate) {
        const cstDate = new Date(pdtDate);
        cstDate.setHours(cstDate.getHours() + 2);
        return cstDate;
    },
    CSTtoPDT: function(cstDate) {
        const pdtDate = new Date(cstDate);
        pdtDate.setHours(pdtDate.getHours() - 2);
        return pdtDate;
    },
    formatCSTTime: function(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
};

// 模拟convertToMilliseconds函数
function convertToMilliseconds(count, unit) {
    const unitMap = {
        'minutes': 60 * 1000,
        'hours': 60 * 60 * 1000,
        'days': 24 * 60 * 60 * 1000
    };
    return count * unitMap[unit];
}

// 模拟convertFromMilliseconds函数（修复后）
function convertFromMilliseconds(ms) {
    // 处理负数情况
    if (ms < 0) {
        return { value: Math.abs(Math.round(ms / (60 * 1000))), unit: 'minute', text: '分钟' };
    }
    
    if (ms >= 30 * 24 * 60 * 60 * 1000) {
        return { value: Math.round(ms / (30 * 24 * 60 * 60 * 1000)), unit: 'month', text: '月' };
    } else if (ms >= 7 * 24 * 60 * 60 * 1000) {
        return { value: Math.round(ms / (7 * 24 * 60 * 60 * 1000)), unit: 'week', text: '周' };
    } else if (ms >= 24 * 60 * 60 * 1000) {
        return { value: Math.round(ms / (24 * 60 * 60 * 1000)), unit: 'day', text: '天' };
    } else if (ms >= 60 * 60 * 1000) {
        return { value: Math.round(ms / (60 * 60 * 1000)), unit: 'hour', text: '小时' };
    } else {
        return { value: Math.round(ms / (60 * 1000)), unit: 'minute', text: '分钟' };
    }
}

// 模拟formatCountdown函数
function formatCountdown(ms) {
    if (ms < 0) return "已开始";
    
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    if (days > 0) {
        return `${days}天${hours}时后`;
    } else if (hours > 0) {
        return `${hours}时${minutes}分后`;
    } else if (minutes > 0) {
        return `${minutes}分${seconds}秒后`;
    } else {
        return `${seconds}秒后`;
    }
}

// 模拟getNextOccurrence函数（修复后）
function getNextOccurrence(task, nowCST) {
    const nowPDT = TimeZoneUtils.CSTtoPDT(nowCST);
    const today = new Date(nowPDT);
    today.setHours(0, 0, 0, 0);
    
    const startHour = 0; // 这里只是示例，实际应该从task中获取
    const startMinute = 0;
    
    if (task.recurrence.type === "weekly") {
        const todayWeekday = nowPDT.getDay();
        
        if (task.recurrence.weeklyRepeatType === "time-range" && task.recurrence.rangeStart && task.recurrence.rangeEnd && task.recurrence.intervalCount && task.recurrence.intervalUnit) {
            const [rangeStartHour, rangeStartMinute] = task.recurrence.rangeStart.split(':').map(Number);
            const [rangeEndHour, rangeEndMinute] = task.recurrence.rangeEnd.split(':').map(Number);
            
            const rangeStartMinutes = rangeStartHour * 60 + rangeStartMinute;
            const rangeEndMinutes = rangeEndHour * 60 + rangeEndMinute;
            const rangeDurationMinutes = rangeEndMinutes >= rangeStartMinutes ? rangeEndMinutes - rangeStartMinutes : 1440 + rangeEndMinutes - rangeStartMinutes;
            
            const intervalMs = convertToMilliseconds(task.recurrence.intervalCount, task.recurrence.intervalUnit);
            const durationMs = convertToMilliseconds(task.duration, task.durationUnit || "minutes");
            
            const candidates = [];
            
            for (let i = 0; i < 7; i++) {
                const checkDay = (todayWeekday + i) % 7;
                if (task.recurrence.weekdays.includes(checkDay)) {
                    const dayRangeStartPDT = new Date(nowPDT);
                    dayRangeStartPDT.setDate(dayRangeStartPDT.getDate() + i);
                    dayRangeStartPDT.setHours(rangeStartHour, rangeStartMinute, 0, 0);
                    
                    const dayRangeEndPDT = new Date(nowPDT);
                    dayRangeEndPDT.setDate(dayRangeEndPDT.getDate() + i);
                    dayRangeEndPDT.setHours(rangeEndHour, rangeEndMinute, 0, 0);
                    
                    if (dayRangeEndPDT < dayRangeStartPDT) {
                        dayRangeEndPDT.setDate(dayRangeEndPDT.getDate() + 1);
                    }
                    
                    const dayRangeStartCST = TimeZoneUtils.PDTtoCST(dayRangeStartPDT);
                    const dayRangeEndCST = TimeZoneUtils.PDTtoCST(dayRangeEndPDT);
                    
                    const timeSinceRangeStart = nowCST >= dayRangeStartCST ? nowCST - dayRangeStartCST : 0;
                    const currentInterval = Math.floor(timeSinceRangeStart / intervalMs);
                    
                    let currentEventStartCST = new Date(dayRangeStartCST.getTime() + currentInterval * intervalMs);
                    let currentEventEndCST = new Date(currentEventStartCST.getTime() + durationMs);
                    
                    if (nowCST >= currentEventStartCST && nowCST < currentEventEndCST) {
                        return {
                            startTime: currentEventStartCST,
                            location: ""
                        };
                    }
                    
                    if (nowCST >= dayRangeStartCST && nowCST < dayRangeEndCST) {
                        let nextInterval = currentInterval + 1;
                        let nextEventStartCST = new Date(dayRangeStartCST.getTime() + nextInterval * intervalMs);
                        let nextEventEndCST = new Date(nextEventStartCST.getTime() + durationMs);
                        
                        if (nextEventStartCST < dayRangeEndCST) {
                            return {
                                startTime: nextEventStartCST,
                                location: ""
                            };
                        }
                    } else if (nowCST >= dayRangeEndCST) {
                        continue;
                    }
                    
                    // 只有当当前检查的日期是今天且时间在时间段之前，或者是未来的日期时，才添加到候选列表
                    let nextInterval = 0;
                    let nextEventStartCST = new Date(dayRangeStartCST.getTime() + nextInterval * intervalMs);
                    
                    if (i === 0) {
                        if (nextEventStartCST > nowCST) {
                            candidates.push(nextEventStartCST);
                        }
                    } else {
                        candidates.push(nextEventStartCST);
                    }
                }
            }
            
            if (candidates.length > 0) {
                // 选择最近的时间点
                candidates.sort((a, b) => a - b);
                const nextTimeCST = candidates[0];
                return {
                    startTime: nextTimeCST,
                    location: ""
                };
            }
        }
    }
    
    return null;
}

// 测试案例：每周六时间段间隔事件（用户报告的情况）
const testTask = {
    recurrence: {
        type: "weekly",
        weeklyRepeatType: "time-range",
        weekdays: [6], // 周六
        rangeStart: "09:01",
        rangeEnd: "19:02",
        intervalCount: 1,
        intervalUnit: "hours"
    },
    duration: 60, // 60分钟
    durationUnit: "minutes"
};

// 测试场景1：当前时间是周六18:00 PDT（20:00 CST），在时间段内但接近结束
console.log("=== 测试场景1：周六18:00 PDT（20:00 CST），在时间段内 ===");
const testTime1 = new Date("2023-12-09T18:00:00-08:00"); // 周六18:00 PDT
const testTime1CST = TimeZoneUtils.PDTtoCST(testTime1);
console.log(`当前时间（PDT）: ${testTime1.toLocaleString()}`);
console.log(`当前时间（CST）: ${testTime1CST.toLocaleString()}`);

const nextOccurrence1 = getNextOccurrence(testTask, testTime1CST);
if (nextOccurrence1) {
    console.log(`下一个事件开始时间: ${nextOccurrence1.startTime.toLocaleString()}`);
    const timeUntilStart1 = nextOccurrence1.startTime - testTime1CST;
    console.log(`距离开始时间: ${timeUntilStart1}毫秒`);
    console.log(`分钟数: ${Math.ceil(timeUntilStart1 / (1000 * 60))}`);
    
    const converted1 = convertFromMilliseconds(timeUntilStart1);
    const timeText1 = `${converted1.value}${converted1.text}后开始`;
    console.log(`timeText: ${timeText1}`);
    console.log(`countdownText: ${formatCountdown(timeUntilStart1)}`);
    
    if (timeUntilStart1 > 0) {
        console.log("✅ 正确：返回了未来的时间点！");
    } else {
        console.log("❌ 错误：返回了过去的时间点！");
    }
}

console.log("\n=== 测试场景2：当前时间是周六20:00 PDT（22:00 CST），已过当天时间段 ===");
const testTime2 = new Date("2023-12-09T20:00:00-08:00"); // 周六20:00 PDT
const testTime2CST = TimeZoneUtils.PDTtoCST(testTime2);
console.log(`当前时间（PDT）: ${testTime2.toLocaleString()}`);
console.log(`当前时间（CST）: ${testTime2CST.toLocaleString()}`);

const nextOccurrence2 = getNextOccurrence(testTask, testTime2CST);
if (nextOccurrence2) {
    console.log(`下一个事件开始时间: ${nextOccurrence2.startTime.toLocaleString()}`);
    const timeUntilStart2 = nextOccurrence2.startTime - testTime2CST;
    console.log(`距离开始时间: ${timeUntilStart2}毫秒`);
    console.log(`分钟数: ${Math.ceil(timeUntilStart2 / (1000 * 60))}`);
    
    const converted2 = convertFromMilliseconds(timeUntilStart2);
    const timeText2 = `${converted2.value}${converted2.text}后开始`;
    console.log(`timeText: ${timeText2}`);
    console.log(`countdownText: ${formatCountdown(timeUntilStart2)}`);
    
    if (timeUntilStart2 > 0) {
        console.log("✅ 正确：返回了未来的时间点！");
    } else {
        console.log("❌ 错误：返回了过去的时间点！");
    }
}

console.log("\n=== 测试场景3：当前时间是周日12:00 PDT（14:00 CST），已过周六时间段 ===");
const testTime3 = new Date("2023-12-10T12:00:00-08:00"); // 周日12:00 PDT
const testTime3CST = TimeZoneUtils.PDTtoCST(testTime3);
console.log(`当前时间（PDT）: ${testTime3.toLocaleString()}`);
console.log(`当前时间（CST）: ${testTime3CST.toLocaleString()}`);

const nextOccurrence3 = getNextOccurrence(testTask, testTime3CST);
if (nextOccurrence3) {
    console.log(`下一个事件开始时间: ${nextOccurrence3.startTime.toLocaleString()}`);
    const timeUntilStart3 = nextOccurrence3.startTime - testTime3CST;
    console.log(`距离开始时间: ${timeUntilStart3}毫秒`);
    console.log(`分钟数: ${Math.ceil(timeUntilStart3 / (1000 * 60))}`);
    
    const converted3 = convertFromMilliseconds(timeUntilStart3);
    const timeText3 = `${converted3.value}${converted3.text}后开始`;
    console.log(`timeText: ${timeText3}`);
    console.log(`countdownText: ${formatCountdown(timeUntilStart3)}`);
    
    if (timeUntilStart3 > 0) {
        console.log("✅ 正确：返回了未来的时间点！");
    } else {
        console.log("❌ 错误：返回了过去的时间点！");
    }
}

// 测试convertFromMilliseconds函数的负数处理
console.log("\n=== 测试convertFromMilliseconds函数的负数处理 ===");
const negativeMs = -199 * 60 * 1000;
const convertedNegative = convertFromMilliseconds(negativeMs);
console.log(`输入: ${negativeMs}毫秒 (-199分钟)`);
console.log(`输出: ${convertedNegative.value}${convertedNegative.text}`);
if (convertedNegative.value === 199 && convertedNegative.text === '分钟') {
    console.log("✅ 正确：负数被转换为正数！");
} else {
    console.log("❌ 错误：负数处理不正确！");
}