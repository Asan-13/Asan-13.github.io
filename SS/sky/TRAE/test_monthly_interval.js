// 测试monthly_interval类型事件的时间计算
// 模拟用户场景：每月12,13,14日，间隔4小时，01:10开始，今天是13号

// 模拟TimeZoneUtils对象
const TimeZoneUtils = {
    PDTtoCST: function(datePDT) {
        // PDT比CST晚7小时（夏令时），这里简化处理
        return new Date(datePDT.getTime() + 7 * 60 * 60 * 1000);
    },
    CSTtoPDT: function(dateCST) {
        return new Date(dateCST.getTime() - 7 * 60 * 60 * 1000);
    }
};

// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    switch (unit) {
        case 'hour': return value * 60 * 60 * 1000;
        case 'minute': return value * 60 * 1000;
        case 'day': return value * 24 * 60 * 60 * 1000;
        case 'month': return value * 30 * 24 * 60 * 60 * 1000; // 近似值
        default: return value * 60 * 60 * 1000;
    }
}

// 模拟getNextOccurrence函数中的monthly_interval处理逻辑
function testMonthlyIntervalNextOccurrence() {
    // 创建测试任务
    const testTask = {
        name: "测试-每月+间隔",
        recurrence: {
            type: "monthly_interval",
            days: [12, 13, 14],
            intervalCount: 4,
            intervalUnit: "hour",
            startTimes: ["01:10"],
            duration: 30,
            durationUnit: "minute"
        },
        startTimeStr: "01:10"
    };

    // 模拟当前时间：13号02:30 CST
    // 这意味着当前PDT时间是12号19:30
    const nowCST = new Date(2023, 5, 13, 2, 30, 0); // 2023年6月13日 02:30 CST
    const nowPDT = TimeZoneUtils.CSTtoPDT(nowCST);

    // 解析startTimeStr获取初始开始时间
    let startHour, startMinute;
    if (testTask.startTimeStr) {
        [startHour, startMinute] = testTask.startTimeStr.split(':').map(Number);
    } else {
        [startHour, startMinute] = [0, 0];
    }

    console.log("=== 测试monthly_interval类型事件时间计算 ===");
    console.log("测试任务:", testTask.name);
    console.log("重复类型:", testTask.recurrence.type);
    console.log("每月天数:", testTask.recurrence.days);
    console.log("间隔:", testTask.recurrence.intervalCount, testTask.recurrence.intervalUnit);
    console.log("开始时间:", testTask.recurrence.startTimes);
    console.log("持续时间:", testTask.recurrence.duration, testTask.recurrence.durationUnit);
    console.log("当前时间:", nowCST.toLocaleString());

    // 首先检查当前是否正在进行中
    const durationMs = convertToMilliseconds(testTask.recurrence.duration, testTask.recurrence.durationUnit);
    
    let found = false;
    let nextTimePDT = null;
    
    // 计算所有候选时间点
    const allCandidates = [];
    
    // 获取所有时间点，如果没有则使用当前的startHour和startMinute
    const timePoints = testTask.recurrence.startTimes && testTask.recurrence.startTimes.length > 0 ? 
        testTask.recurrence.startTimes.map(timeStr => {
            const [h, m] = timeStr.split(':').map(Number);
            return { hour: h, minute: m };
        }) : [{ hour: startHour, minute: startMinute }];
    
    const intervalCount = testTask.recurrence.intervalCount || 1;
    const intervalUnit = testTask.recurrence.intervalUnit || "hour"; // 默认小时间隔
    const intervalMs = convertToMilliseconds(intervalCount, intervalUnit);
    
    // 遍历所有指定的日期
    for (let day of testTask.recurrence.days) {
        // 创建当天的基础CST时间
        const baseDateCST = new Date(nowCST);
        baseDateCST.setDate(day);
        baseDateCST.setHours(0, 0, 0, 0);
        
        console.log(`\n检查日期: ${day}号`);
        
        for (let j = 0; j < timePoints.length; j++) {
            const { hour, minute } = timePoints[j];
            
            // 创建当天的起始时间点（CST）
            let currentTimeCST = new Date(baseDateCST);
            currentTimeCST.setHours(hour, minute, 0, 0);
            
            console.log(`  初始时间点(CST): ${currentTimeCST.toLocaleString()}`);
            
            // 如果当前时间点在当前时间之前，计算下一个间隔
            while (currentTimeCST < nowCST) {
                console.log(`  时间点 ${currentTimeCST.toLocaleString()} 已过去，计算下一个间隔`);
                currentTimeCST = new Date(currentTimeCST.getTime() + intervalMs);
            }
            
            // 检查这个时间点是否仍然在同一天内
            if (currentTimeCST.getDate() === day) {
                // 转换为PDT时间用于存储
                const currentTimePDT = TimeZoneUtils.CSTtoPDT(currentTimeCST);
                console.log(`  添加候选时间点: ${currentTimeCST.toLocaleString()} (CST)`);
                allCandidates.push(currentTimePDT);
            }
        }
    }
    
    // 如果有候选时间点，选择最近的一个
    if (allCandidates.length > 0) {
        allCandidates.sort((a, b) => a - b);
        nextTimePDT = allCandidates[0];
        found = true;
        console.log(`\n找到 ${allCandidates.length} 个候选时间点`);
    }

    // 转换为CST时间
    const nextTimeCST = TimeZoneUtils.PDTtoCST(nextTimePDT);

    console.log("\n=== 计算结果 ===");
    console.log("下一次发生时间(PDT):", nextTimePDT ? nextTimePDT.toLocaleString() : "未找到");
    console.log("下一次发生时间(CST):", nextTimeCST ? nextTimeCST.toLocaleString() : "未找到");

    // 验证结果是否正确
    const expectedHour = 5;
    const expectedMinute = 10;
    const expectedDay = 13;

    if (nextTimeCST && nextTimeCST.getDate() === expectedDay && nextTimeCST.getHours() === expectedHour && nextTimeCST.getMinutes() === expectedMinute) {
        console.log("✅ 验证通过: 下一次发生时间计算正确，应为13号05:10");
    } else {
        console.log(`❌ 验证失败: 下一次发生时间应该是${expectedDay}号${expectedHour}:${expectedMinute}，实际计算为${nextTimeCST ? nextTimeCST.getDate() : '未知'}号${nextTimeCST ? nextTimeCST.getHours() : '未知'}:${nextTimeCST ? nextTimeCST.getMinutes() : '未知'}`);
    }

    return nextTimeCST;
}

// 运行测试
testMonthlyIntervalNextOccurrence();