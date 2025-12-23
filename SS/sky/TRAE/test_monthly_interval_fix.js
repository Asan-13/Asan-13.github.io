// 测试脚本：验证monthly_interval类型事件的日期计算修复效果

// 模拟当前时间为12月13日
const nowCST = new Date(2023, 11, 13, 9, 0, 0); // 12月13日 09:00 CST
console.log(`当前时间: ${nowCST}`);

// 测试任务：每月1日、2日 11:00 每4小时
const testTask = {
    recurrence: {
        type: "monthly_interval",
        days: [1, 2],
        count: 4,
        unit: "hour",
        startTimes: ["11:00"],
        duration: 1,
        durationUnit: "hour"
    }
};

// 模拟修复后的日期计算逻辑
function testDateCalculation() {
    const days = testTask.recurrence.days.map(Number).sort((a, b) => a - b);
    const intervalCount = testTask.recurrence.count || 1;
    const intervalUnit = testTask.recurrence.intervalUnit || testTask.recurrence.unit || "hour";
    
    // 简单的毫秒转换（仅用于测试）
    const intervalMs = {
        "minute": 60 * 1000,
        "hour": 60 * 60 * 1000,
        "day": 24 * 60 * 60 * 1000,
        "week": 7 * 24 * 60 * 60 * 1000,
        "month": 30 * 24 * 60 * 60 * 1000
    }[intervalUnit] * intervalCount;
    
    // 获取所有时间点
    const timePoints = testTask.recurrence.startTimes.map(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        return { hour: h, minute: m };
    });
    
    // 计算所有候选时间点
    const allCandidates = [];
    
    // 遍历所有指定的日期
    for (let day of days) {
        // 创建当天的基础CST时间
        const baseDateCST = new Date(nowCST);
        
        // 如果指定的日期已经小于当前日期，设置为下个月
        if (day < nowCST.getDate()) {
            baseDateCST.setMonth(baseDateCST.getMonth() + 1);
        }
        
        baseDateCST.setDate(day);
        baseDateCST.setHours(0, 0, 0, 0);
        
        for (let j = 0; j < timePoints.length; j++) {
            const { hour, minute } = timePoints[j];
            
            // 创建当天的起始时间点（CST）
            let currentTimeCST = new Date(baseDateCST);
            currentTimeCST.setHours(hour, minute, 0, 0);
            
            // 如果当前时间点在当前时间之前，计算下一个间隔
            while (currentTimeCST < nowCST) {
                currentTimeCST = new Date(currentTimeCST.getTime() + intervalMs);
            }
            
            // 检查这个时间点是否仍然在同一天内
            if (currentTimeCST.getDate() === day) {
                allCandidates.push(currentTimeCST);
            }
        }
    }
    
    // 如果有候选时间点，选择最近的一个
    if (allCandidates.length > 0) {
        allCandidates.sort((a, b) => a - b);
        return allCandidates[0];
    }
    
    return null;
}

// 执行测试
const nextEventTime = testDateCalculation();
if (nextEventTime) {
    console.log(`下一个事件时间: ${nextEventTime}`);
    console.log(`月份: ${nextEventTime.getMonth() + 1}`);
    console.log(`日期: ${nextEventTime.getDate()}`);
    console.log(`时间: ${nextEventTime.getHours()}:${String(nextEventTime.getMinutes()).padStart(2, '0')}`);
    
    // 验证结果是否正确
    if (nextEventTime.getMonth() === 0 && nextEventTime.getDate() === 1) {
        console.log("✅ 测试通过：正确计算出下个月1日的事件");
    } else {
        console.log("❌ 测试失败：日期计算不正确");
    }
} else {
    console.log("❌ 测试失败：未找到下一个事件时间");
}