// 测试daily重复类型的时间段模式修复

// 模拟TimeZoneUtils对象（与实际代码保持一致）
const TimeZoneUtils = {
    isPDT: function() {
        return false; // 简化测试，始终返回false
    },
    
    PDTtoCST: function(pdtDate) {
        // CST = PDT + 16小时
        const cstDate = new Date(pdtDate.getTime());
        cstDate.setHours(cstDate.getHours() + 16);
        return cstDate;
    },
    
    CSTtoPDT: function(cstDate) {
        // PDT = CST - 16小时
        const pdtDate = new Date(cstDate.getTime());
        pdtDate.setHours(pdtDate.getHours() - 16);
        return pdtDate;
    }
};

// 辅助函数：将时间转换为毫秒
function convertToMilliseconds(count, unit) {
    const unitMultipliers = {
        "minute": 60 * 1000,
        "hour": 60 * 60 * 1000,
        "day": 24 * 60 * 60 * 1000,
        "week": 7 * 24 * 60 * 60 * 1000,
        "month": 30 * 24 * 60 * 60 * 1000
    };
    return count * (unitMultipliers[unit] || 60 * 1000);
}

// 测试用的getNextOccurrence函数（只包含daily部分的修复代码）
function getNextOccurrence(task, nowCST) {
    // 创建nowPDT变量表示当前太平洋时间
    const nowPDT = TimeZoneUtils.CSTtoPDT(nowCST);
    
    // 简化的初始时间设置
    let startHour = 0;
    let startMinute = 0;
    
    // 每天重复的修复代码
    if (task.recurrence.type === "daily") {
        let timePoints = [];
        
        // 检查是时间点模式还是时间段模式
        if (task.recurrence.rangeStart && task.recurrence.rangeEnd) {
            // 时间段模式：根据rangeStart、rangeEnd、intervalCount和intervalUnit生成时间点
            const [rangeStartHour, rangeStartMinute] = task.recurrence.rangeStart.split(':').map(Number);
            const [rangeEndHour, rangeEndMinute] = task.recurrence.rangeEnd.split(':').map(Number);
            const intervalCount = parseInt(task.recurrence.intervalCount) || 1;
            const intervalUnit = task.recurrence.intervalUnit || 'hour';
            
            // 计算间隔毫秒数
            const intervalMs = convertToMilliseconds(intervalCount, intervalUnit);
            
            // 创建开始和结束时间的Date对象
            const startDatePDT = new Date(nowPDT.getFullYear(), nowPDT.getMonth(), nowPDT.getDate(), rangeStartHour, rangeStartMinute, 0, 0);
            const endDatePDT = new Date(nowPDT.getFullYear(), nowPDT.getMonth(), nowPDT.getDate(), rangeEndHour, rangeEndMinute, 0, 0);
            
            // 生成时间段内所有的时间点
            let currentTimePDT = new Date(startDatePDT);
            while (currentTimePDT <= endDatePDT) {
                timePoints.push({
                    hour: currentTimePDT.getHours(),
                    minute: currentTimePDT.getMinutes()
                });
                currentTimePDT.setTime(currentTimePDT.getTime() + intervalMs);
            }
            console.log('生成的时间点:', timePoints);
        } else {
            // 时间点模式：使用startTimes数组或默认时间点
            timePoints = task.recurrence.startTimes && task.recurrence.startTimes.length > 0 ? 
                task.recurrence.startTimes.map(timeStr => {
                    const [h, m] = timeStr.split(':').map(Number);
                    return { hour: h, minute: m };
                }) : [{ hour: startHour, minute: startMinute }];
        }
        
        // 计算今天和明天的所有时间点组合
        const today = new Date(nowPDT);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const candidates = [];
        
        // 检查今天的所有时间点
        for (const { hour, minute } of timePoints) {
            const testDatePDT = new Date(today);
            testDatePDT.setHours(hour, minute, 0, 0);
            if (testDatePDT > nowPDT) {
                candidates.push(testDatePDT);
            }
        }
        
        // 如果今天没有找到合适的时间点，检查明天的所有时间点
        if (candidates.length === 0) {
            for (const { hour, minute } of timePoints) {
                const testDatePDT = new Date(tomorrow);
                testDatePDT.setHours(hour, minute, 0, 0);
                candidates.push(testDatePDT);
            }
        }
        
        // 选择最近的时间点
        candidates.sort((a, b) => a - b);
        
        // 检查是否正在进行中（需要检查所有时间点，包括今天已经发生过的时间点）
        const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
        
        // 首先检查今天的所有时间点（包括已经发生过的），看是否有正在进行中的事件
        for (const { hour, minute } of timePoints) {
            const testDatePDT = new Date(today);
            testDatePDT.setHours(hour, minute, 0, 0);
            const candidateCST = TimeZoneUtils.PDTtoCST(testDatePDT);
            if (candidateCST <= nowCST && nowCST < candidateCST.getTime() + durationMs) {
                return {
                    startTime: candidateCST,
                    location: ""
                };
            }
        }
        
        // 如果没有正在进行中的事件，返回最近的时间点
        if (candidates.length > 0) {
            return {
                startTime: TimeZoneUtils.PDTtoCST(candidates[0]),
                location: ""
            };
        }
    }
    
    return null;
}

// 模拟用户设置的任务
const testTask = {
    recurrence: {
        type: "daily",
        rangeStart: "07:01",
        rangeEnd: "23:03",
        intervalCount: "1",
        intervalUnit: "hour",
        duration: "15",
        durationUnit: "minute"
    }
};

// 测试场景
const testScenarios = [
    {
        name: "场景1: CST 08:30 (PDT 16:30)",
        testTime: new Date(Date.UTC(2024, 0, 1, 0, 30, 0, 0)) // UTC 00:30 = CST 08:30
    },
    {
        name: "场景2: CST 12:00 (PDT 20:00)",
        testTime: new Date(Date.UTC(2024, 0, 1, 4, 0, 0, 0)) // UTC 04:00 = CST 12:00
    },
    {
        name: "场景3: CST 23:00 (PDT 07:00 次日)",
        testTime: new Date(Date.UTC(2024, 0, 1, 15, 0, 0, 0)) // UTC 15:00 = CST 23:00
    },
    {
        name: "场景4: CST 23:30 (PDT 07:30 次日)",
        testTime: new Date(Date.UTC(2024, 0, 1, 15, 30, 0, 0)) // UTC 15:30 = CST 23:30
    }
];

// 运行测试
console.log("=== 测试daily重复类型的时间段模式 ===");
console.log("测试任务: 每天07:01-23:03，每1小时一次，持续15分钟");
console.log("======================================");

testScenarios.forEach((scenario, index) => {
    console.log(`\n${scenario.name}:`);
    
    const nowCST = scenario.testTime;
    console.log(`当前CST时间: ${nowCST.toISOString().slice(11, 19)}`);
    
    const nextOccurrence = getNextOccurrence(testTask, nowCST);
    if (nextOccurrence) {
        const startTimeCST = nextOccurrence.startTime;
        const endTimeCST = new Date(startTimeCST.getTime() + convertToMilliseconds(testTask.recurrence.duration, testTask.recurrence.durationUnit));
        
        console.log(`事件开始时间: ${startTimeCST.toISOString().slice(11, 19)}`);
        console.log(`事件结束时间: ${endTimeCST.toISOString().slice(11, 19)}`);
        
        // 检查是否是正在进行中
        if (startTimeCST <= nowCST && nowCST < endTimeCST) {
            console.log("事件状态: ongoing");
        } else {
            console.log("事件状态: upcoming");
        }
        
        // 检查是否错误地显示为明天00:00
        if (startTimeCST.getHours() === 0 && startTimeCST.getMinutes() === 0) {
            console.log("❌ 错误: 事件显示为明天00:00-00:15");
        } else {
            console.log("✅ 正确: 事件显示在设置的时间段内");
        }
    } else {
        console.log("❌ 错误: 未找到下一个事件");
    }
});

console.log("\n=== 测试完成 ===");
