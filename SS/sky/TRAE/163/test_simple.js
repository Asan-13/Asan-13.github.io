// 简化测试脚本
function convertToMilliseconds(value, unit) {
    const conversions = {
        "minute": 60 * 1000,
        "hour": 60 * 60 * 1000,
        "day": 24 * 60 * 60 * 1000
    };
    return value * conversions[unit] || 0;
}

function getNextOccurrence(task, now) {
    try {
        if (task.recurrence.type === "monthly_interval") {
            const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
            const monthlySubType = "time-range";
            
            let days = task.recurrence.days && task.recurrence.days.length > 0 ? 
                task.recurrence.days.map(Number).sort((a, b) => a - b) : [1];
            
            const today = new Date(now);
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const currentDate = today.getDate();
            
            const checkMonths = [];
            for (let i = 0; i < 3; i++) {
                const checkMonth = currentMonth + i;
                const checkYear = currentYear + Math.floor(checkMonth / 12);
                const normalizedMonth = checkMonth % 12;
                checkMonths.push({ year: checkYear, month: normalizedMonth });
            }
            
            for (const monthInfo of checkMonths) {
                const { year, month } = monthInfo;
                
                for (const day of days) {
                    const candidateDate = new Date(year, month, day);
                    
                    if (candidateDate.getDate() !== day) {
                        continue;
                    }
                    
                    if (candidateDate < today && !(candidateDate.getDate() === currentDate && candidateDate.getMonth() === currentMonth && candidateDate.getFullYear() === currentYear)) {
                        continue;
                    }
                    
                    if (monthlySubType === "time-range") {
                        // 修复核心：使用task.startTime而不是task.recurrence.rangeStart
                        let rangeStartStr, rangeEndStr;
                        if (task.recurrence.type === "monthly_interval") {
                            rangeStartStr = task.startTime || "00:00";
                            rangeEndStr = task.recurrence.rangeEnd || "23:59";
                        } else {
                            rangeStartStr = task.recurrence.rangeStart || "09:00";
                            rangeEndStr = task.recurrence.rangeEnd || "18:00";
                        }
                        const intervalCount = task.recurrence.intervalCount || task.recurrence.count || 1;
                        const intervalUnit = task.recurrence.intervalUnit || task.recurrence.unit || "hour";
                        const intervalMs = convertToMilliseconds(intervalCount, intervalUnit);
                        
                        const [rangeStartHour, rangeStartMinute] = rangeStartStr.split(':').map(Number);
                        const [rangeEndHour, rangeEndMinute] = rangeEndStr.split(':').map(Number);
                        
                        const rangeStart = new Date(candidateDate);
                        rangeStart.setHours(rangeStartHour, rangeStartMinute, 0, 0);
                        
                        const rangeEnd = new Date(candidateDate);
                        rangeEnd.setHours(rangeEndHour, rangeEndMinute, 0, 0);
                        
                        let currentTime = new Date(rangeStart);
                        while (currentTime <= rangeEnd) {
                            if (now >= currentTime && now < currentTime.getTime() + durationMs) {
                                return {
                                    startTime: currentTime,
                                    status: "ongoing"
                                };
                            }
                            
                            if (currentTime > now) {
                                return {
                                    startTime: currentTime,
                                    status: "future"
                                };
                            }
                            
                            currentTime = new Date(currentTime.getTime() + intervalMs);
                        }
                    }
                }
            }
        }
        
        return {
            startTime: new Date(now.getTime() + 3600000),
            status: "default"
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            startTime: new Date(now.getTime() + 3600000),
            status: "error"
        };
    }
}

// 测试用例：当前时间是04:50，事件从00:00开始，每1小时一次
const testCase = {
    id: "test1",
    name: "monthly_interval测试",
    startTime: "00:00",
    recurrence: {
        type: "monthly_interval",
        days: [23],
        intervalCount: 1,
        intervalUnit: "hour",
        duration: 30,
        durationUnit: "minute"
    }
};

// 测试用例1：当前时间在事件时间段内
const now1 = new Date(2025, 0, 23, 4, 15); // 2025-01-23 04:15:00
console.log('=== 测试用例1：当前时间在事件时间段内 ===');
console.log('当前时间:', now1.toLocaleString('zh-CN'));
console.log('事件配置:', `每月${testCase.recurrence.days}日 ${testCase.startTime} 每${testCase.recurrence.intervalCount}${testCase.recurrence.intervalUnit}`);

const result1 = getNextOccurrence(testCase, now1);
console.log('\n修复结果:');
console.log('事件状态:', result1.status);
console.log('事件时间:', result1.startTime.toLocaleString('zh-CN'));

if (result1.status === "ongoing") {
    console.log('✅ 修复成功！事件正确显示为进行中');
} else {
    console.log('❌ 修复失败！事件未显示为进行中');
}

// 测试用例2：当前时间在事件时间段外
const now2 = new Date(2025, 0, 23, 4, 50); // 2025-01-23 04:50:00
console.log('\n=== 测试用例2：当前时间在事件时间段外 ===');
console.log('当前时间:', now2.toLocaleString('zh-CN'));

const result2 = getNextOccurrence(testCase, now2);
console.log('\n修复结果:');
console.log('事件状态:', result2.status);
console.log('事件时间:', result2.startTime.toLocaleString('zh-CN'));

if (result2.status === "future") {
    console.log('✅ 修复成功！事件正确显示为未来事件');
} else {
    console.log('❌ 修复失败！事件未显示为未来事件');
}