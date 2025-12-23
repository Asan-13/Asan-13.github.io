// 测试monthly_interval事件的getNextOccurrence函数
console.log('=== monthly_interval事件测试 ===\n');

// 模拟当前时间 - 假设事件正在进行中
const now = new Date(2025, 11, 1, 10, 15); // 2025-12-01 10:15:00 (每月1号，在9:00-18:00之间，间隔1小时，当前是第2个事件：10:00开始)
console.log(`当前时间: ${now.toLocaleString('zh-CN')}`);
console.log();

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

// 从index.html中复制getNextOccurrence函数的核心逻辑进行测试
function testMonthlyIntervalLogic() {
    // 创建测试用的monthly_interval事件
    const task = {
        id: "test-monthly-interval",
        name: "每月间隔测试",
        startTime: "09:00",
        recurrence: {
            type: "monthly_interval",
            // 注意：没有设置subType，应该默认使用time-range
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

    console.log(`测试任务: ${task.name}`);
    console.log(`事件类型: ${task.recurrence.type}`);
    console.log(`每月重复日期: ${task.recurrence.days[0]}号`);
    console.log(`时间范围: ${task.recurrence.rangeStart}-${task.recurrence.rangeEnd}`);
    console.log(`间隔: 每${task.recurrence.intervalCount}${task.recurrence.intervalUnit}`);
    console.log(`持续时间: ${task.recurrence.duration}${task.recurrence.durationUnit}`);
    console.log();

    // 执行修复后的逻辑
    const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
    
    // 获取子模式，默认为time-points
    // 对于monthly_interval类型，强制使用time-range子类型（修复后的逻辑）
    let monthlySubType = task.recurrence.monthlyRepeatType || task.recurrence.repeatType || task.recurrence.subType || "time-points";
    if (task.recurrence.type === "monthly_interval") {
        monthlySubType = "time-range"; // 每月间隔重复模式强制使用time-range子类型
    }

    console.log(`修复前子类型: time-points (默认)`);
    console.log(`修复后子类型: ${monthlySubType}`);
    console.log();

    // 确定按月的哪一天重复
    let days = [];
    if (task.recurrence.days && task.recurrence.days.length > 0) {
        days = task.recurrence.days.map(Number).sort((a, b) => a - b);
    } else {
        days = [1];
    }

    const today = new Date(now);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    // 检查今天是否是重复日期
    if (days.includes(currentDate)) {
        console.log(`✓ 今天(${currentDate}号)是重复日期`);
        
        if (monthlySubType === "time-range") {
            console.log(`✓ 使用time-range子类型处理`);
            
            const rangeStartStr = task.recurrence.rangeStart || "09:00";
            const rangeEndStr = task.recurrence.rangeEnd || "18:00";
            const intervalCount = task.recurrence.intervalCount || task.recurrence.count || 1;
            const intervalUnit = task.recurrence.intervalUnit || task.recurrence.unit || "hour";
            const intervalMs = convertToMilliseconds(intervalCount, intervalUnit);
            
            const [rangeStartHour, rangeStartMinute] = rangeStartStr.split(':').map(Number);
            const [rangeEndHour, rangeEndMinute] = rangeEndStr.split(':').map(Number);
            
            const candidateDate = new Date(today);
            const rangeStart = new Date(candidateDate);
            rangeStart.setHours(rangeStartHour, rangeStartMinute, 0, 0);
            
            const rangeEnd = new Date(candidateDate);
            rangeEnd.setHours(rangeEndHour, rangeEndMinute, 0, 0);
            
            console.log(`时间范围: ${rangeStart.toLocaleTimeString()} - ${rangeEnd.toLocaleTimeString()}`);
            console.log(`间隔: ${intervalMs}毫秒`);
            console.log();
            
            // 遍历当天的所有时间点
            let currentTime = new Date(rangeStart);
            let eventCount = 0;
            let ongoingEvent = null;
            let nextEvent = null;
            
            while (currentTime <= rangeEnd) {
                eventCount++;
                console.log(`事件${eventCount}: ${currentTime.toLocaleTimeString()} - ${new Date(currentTime.getTime() + durationMs).toLocaleTimeString()}`);
                
                // 检查是否正在进行中
                if (now >= currentTime && now < currentTime.getTime() + durationMs) {
                    ongoingEvent = currentTime;
                    console.log(`  ✓ 当前时间在该事件时间范围内 - 应该返回正在进行的事件`);
                }
                
                // 检查是否是未来时间点
                if (currentTime > now && !nextEvent) {
                    nextEvent = currentTime;
                    console.log(`  ⏰ 未来事件 - 后续事件的开始时间`);
                }
                
                // 计算下一个时间点
                currentTime = new Date(currentTime.getTime() + intervalMs);
            }
            
            console.log();
            if (ongoingEvent) {
                console.log(`✅ 测试通过: 找到了正在进行的事件，开始时间为 ${ongoingEvent.toLocaleTimeString()}`);
            } else {
                console.log(`❌ 测试失败: 没有找到正在进行的事件`);
            }
        } else {
            console.log(`❌ 测试失败: 使用了错误的子类型 ${monthlySubType}`);
        }
    } else {
        console.log(`⚠️  今天(${currentDate}号)不是重复日期，跳过测试`);
    }
}

// 执行测试
testMonthlyIntervalLogic();

console.log('\n=== 测试完成 ===');