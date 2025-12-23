// 测试每周时间段间隔事件的bug

// 模拟TimeZoneUtils
const TimeZoneUtils = {
    PDTtoCST: function(date) {
        // 简单模拟PDT到CST的转换（+2小时）
        const cstDate = new Date(date.getTime() + 2 * 60 * 60 * 1000);
        return cstDate;
    },
    formatCSTTime: function(date) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
};

// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    const conversions = {
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000
    };
    return value * conversions[unit];
}

// 测试事件数据
const testTask = {
    recurrence: {
        type: "weekly",
        weekdays: [6], // 每周六
        weeklyRepeatType: "time-range",
        rangeStart: "09:01",
        rangeEnd: "19:02",
        duration: 60,
        durationUnit: "minute",
        intervalCount: 1,
        intervalUnit: "hour"
    }
};

// 模拟当前时间（假设现在是周六20:00，今天的时间段已经过去）
const nowPDT = new Date(2023, 11, 9, 18, 0, 0); // 2023年12月9日 18:00:00 PDT（周六，时间段19:02已经过去）
const nowCST = TimeZoneUtils.PDTtoCST(nowPDT); // CST时间

console.log("当前时间:");
console.log("PDT:", nowPDT.toLocaleString());
console.log("CST:", nowCST.toLocaleString());

// 测试getNextOccurrence函数中的weekly时间点生成逻辑
function testWeeklyTimeRangeLogic() {
    const todayWeekday = nowPDT.getDay();
    console.log("\n今天是星期", todayWeekday);
    
    const timePoints = [{ hour: 0, minute: 0 }]; // 这里会被覆盖
    
    // 首先检查当前是否是time-range模式且有间隔设置
    if (testTask.recurrence.weeklyRepeatType === "time-range" && testTask.recurrence.rangeStart && testTask.recurrence.rangeEnd && testTask.recurrence.intervalCount && testTask.recurrence.intervalUnit) {
        // 解析时间段
        const [rangeStartHour, rangeStartMinute] = testTask.recurrence.rangeStart.split(':').map(Number);
        const [rangeEndHour, rangeEndMinute] = testTask.recurrence.rangeEnd.split(':').map(Number);
        
        console.log("\n时间段:", testTask.recurrence.rangeStart, "-", testTask.recurrence.rangeEnd);
        
        // 转换为分钟数
        const rangeStartMinutes = rangeStartHour * 60 + rangeStartMinute;
        const rangeEndMinutes = rangeEndHour * 60 + rangeEndMinute;
        const rangeDurationMinutes = rangeEndMinutes >= rangeStartMinutes ? rangeEndMinutes - rangeStartMinutes : 1440 + rangeEndMinutes - rangeStartMinutes;
        
        // 计算间隔毫秒数
        const intervalMs = convertToMilliseconds(testTask.recurrence.intervalCount, testTask.recurrence.intervalUnit);
        console.log("间隔:", intervalMs / (1000 * 60), "分钟");
        
        // 计算事件持续时间
        const durationMs = convertToMilliseconds(testTask.recurrence.duration, testTask.recurrence.durationUnit);
        console.log("事件持续时间:", durationMs / (1000 * 60), "分钟");
        
        // 查找符合条件的星期几
        const candidates = [];
        
        // 检查未来7天内的所有符合条件的星期几
        for (let i = 0; i < 7; i++) {
            const checkDay = (todayWeekday + i) % 7;
            console.log("\n检查第", i, "天，星期", checkDay);
            
            if (testTask.recurrence.weekdays.includes(checkDay)) {
                console.log("  ✓ 这一天符合条件");
                
                // 创建当天的rangeStart时间对象（PDT）
                const dayRangeStartPDT = new Date(nowPDT);
                dayRangeStartPDT.setDate(dayRangeStartPDT.getDate() + i);
                dayRangeStartPDT.setHours(rangeStartHour, rangeStartMinute, 0, 0);
                
                // 创建当天的rangeEnd时间对象（PDT）
                const dayRangeEndPDT = new Date(nowPDT);
                dayRangeEndPDT.setDate(dayRangeEndPDT.getDate() + i);
                dayRangeEndPDT.setHours(rangeEndHour, rangeEndMinute, 0, 0);
                
                // 如果rangeEnd在rangeStart之前，则认为是第二天
                if (dayRangeEndPDT < dayRangeStartPDT) {
                    dayRangeEndPDT.setDate(dayRangeEndPDT.getDate() + 1);
                }
                
                // 转换为CST时间进行比较
                const dayRangeStartCST = TimeZoneUtils.PDTtoCST(dayRangeStartPDT);
                const dayRangeEndCST = TimeZoneUtils.PDTtoCST(dayRangeEndPDT);
                
                console.log("  时间段开始(PDT):", dayRangeStartPDT.toLocaleString());
                console.log("  时间段开始(CST):", dayRangeStartCST.toLocaleString());
                console.log("  时间段结束(CST):", dayRangeEndCST.toLocaleString());
                
                // 计算当前应该处于哪个间隔的事件
                const timeSinceRangeStart = nowCST >= dayRangeStartCST ? nowCST - dayRangeStartCST : 0;
                console.log("  距离时间段开始的时间:", timeSinceRangeStart / (1000 * 60), "分钟");
                
                const currentInterval = Math.floor(timeSinceRangeStart / intervalMs);
                console.log("  当前间隔:", currentInterval);
                
                // 计算当前间隔事件的开始时间
                let currentEventStartCST = new Date(dayRangeStartCST.getTime() + currentInterval * intervalMs);
                let currentEventEndCST = new Date(currentEventStartCST.getTime() + durationMs);
                
                console.log("  当前事件开始:", currentEventStartCST.toLocaleString());
                console.log("  当前事件结束:", currentEventEndCST.toLocaleString());
                
                // 检查是否正在进行中
                if (nowCST >= currentEventStartCST && nowCST < currentEventEndCST) {
                    console.log("  ✅ 正在进行中");
                    return {
                        startTime: currentEventStartCST,
                        location: ""
                    };
                }
                
                // 如果当前时间在时间段内，寻找下一个间隔的事件
                if (nowCST >= dayRangeStartCST && nowCST < dayRangeEndCST) {
                    let nextInterval = currentInterval + 1;
                    let nextEventStartCST = new Date(dayRangeStartCST.getTime() + nextInterval * intervalMs);
                    let nextEventEndCST = new Date(nextEventStartCST.getTime() + durationMs);
                    
                    console.log("  下一个事件开始:", nextEventStartCST.toLocaleString());
                    console.log("  下一个事件结束:", nextEventEndCST.toLocaleString());
                    
                    // 确保下一个事件在时间段内
                    if (nextEventStartCST < dayRangeEndCST) {
                        console.log("  ✅ 下一个事件在时间段内");
                        return {
                            startTime: nextEventStartCST,
                            location: ""
                        };
                    }
                }
                
                // 当前的问题：只有当i > 0时才添加到candidates
                // 这导致今天的时间段过去后，无法正确添加明天的时间点
                console.log("  当前i:", i);
                
                // 测试修复：无论i是否大于0，都添加明天的第一个时间点
                let nextInterval = 0;
                let nextEventStartCST = new Date(dayRangeStartCST.getTime() + nextInterval * intervalMs);
                let nextEventEndCST = new Date(nextEventStartCST.getTime() + durationMs);
                
                console.log("  添加到候选的时间点:", nextEventStartCST.toLocaleString());
                candidates.push(nextEventStartCST);
            }
        }
        
        // 选择最近的时间点
        if (candidates.length > 0) {
            candidates.sort((a, b) => a - b);
            // 只选择未来的时间点
            const futureCandidates = candidates.filter(candidate => candidate > nowCST);
            if (futureCandidates.length > 0) {
                console.log("\n✅ 从候选中选择最早的未来时间点:", futureCandidates[0].toLocaleString());
                return {
                    startTime: futureCandidates[0],
                    location: ""
                };
            }
        }
    }
    
    return null;
}

// 运行测试
const result = testWeeklyTimeRangeLogic();

if (result) {
    console.log("\n最终结果:");
    console.log("开始时间:", result.startTime.toLocaleString());
    
    const timeUntilStart = result.startTime - nowCST;
    console.log("距离开始的时间:", timeUntilStart / (1000 * 60), "分钟");
    console.log("分钟数(Math.ceil):", Math.ceil(timeUntilStart / (1000 * 60)));
    
    if (timeUntilStart < 0) {
        console.log("❌ 错误：返回了过去的时间点！");
    } else {
        console.log("✅ 正确：返回了未来的时间点！");
    }
} else {
    console.log("\n❌ 没有找到合适的时间点");
}