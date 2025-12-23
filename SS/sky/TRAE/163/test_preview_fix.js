// 测试预览卡片中monthly_interval事件的间隔信息显示
console.log('=== 测试预览卡片中monthly_interval事件的间隔信息显示 ===\n');

// 模拟任务数据
const testTask = {
    id: "test-monthly-interval",
    name: "测试每月间隔事件",
    startTime: "09:00", // monthly_interval使用startTime而非rangeStart
    priority: "medium",
    displayThreshold: 10,
    displayThresholdUnit: "minute",
    recurrence: {
        type: "monthly_interval",
        days: [1, 15], // 每月1日和15日
        rangeEnd: "18:00",
        intervalCount: 2,
        intervalUnit: "hour",
        duration: 30,
        durationUnit: "minute"
    }
};

// 模拟unitNames映射
const unitNames = {
    "minute": "分钟",
    "hour": "小时",
    "day": "天",
    "week": "周",
    "month": "月"
};

// 测试函数：模拟showPreviewCard中生成recurrenceText的逻辑
function generateRecurrenceText(task) {
    let recurrenceText = "";
    
    // 处理monthly_interval类型
    if (task.recurrence.type === "monthly_interval") {
        // 确定每月的哪一天重复
        let days = [];
        if (task.recurrence.days && task.recurrence.days.length > 0) {
            days = task.recurrence.days.map(Number).sort((a, b) => a - b);
        } else {
            days = [1];
        }
        
        const selectedDays = days.join(', ');
        const monthlyDateText = `每月 ${selectedDays}日`;
        
        // 获取每月重复子类型，对于monthly_interval类型，强制使用time-range子类型
        const monthlySubType = "time-range";
        
        if (monthlySubType === "time-range") {
            // 处理time-range类型，包括monthly_interval类型
            let displayStartTime = "00:00";
            if (task.recurrence.type === "monthly_interval") {
                // 确保startTime是格式化的时间字符串，不是Date对象
                if (task.startTime) {
                    if (typeof task.startTime === 'string') {
                        displayStartTime = task.startTime;
                    } else if (task.startTime instanceof Date) {
                        // 将Date对象格式化为HH:MM字符串
                        displayStartTime = task.startTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
                    }
                }
            } else {
                displayStartTime = task.recurrence.rangeStart;
            }
            
            // 构建正确格式：每月 1, 15日 09:00 每2小时
            recurrenceText = `${monthlyDateText} ${displayStartTime}`;
            if (task.recurrence.intervalCount && task.recurrence.intervalUnit) {
                recurrenceText += ` 每${task.recurrence.intervalCount}${unitNames[task.recurrence.intervalUnit]}`;
            }
        }
    }
    
    return recurrenceText;
}

// 执行测试
const result = generateRecurrenceText(testTask);
console.log('测试任务:', testTask.name);
console.log('事件类型:', testTask.recurrence.type);
console.log('开始时间:', testTask.startTime);
console.log('每月重复日期:', testTask.recurrence.days);
console.log('间隔:', testTask.recurrence.intervalCount, testTask.recurrence.intervalUnit);
console.log('\n预期结果: 每月 1, 15日 09:00 每2小时');
console.log('实际结果:', result);
console.log('\n测试结果:', result === '每月 1, 15日 09:00 每2小时' ? '✅ 通过' : '❌ 失败');

// 测试另一个case：startTime是Date对象
const testTaskWithDate = {
    ...testTask,
    id: "test-monthly-interval-date",
    startTime: new Date(2025, 0, 1, 14, 30) // 14:30
};

const result2 = generateRecurrenceText(testTaskWithDate);
console.log('\n=== 测试startTime为Date对象的情况 ===');
console.log('测试任务:', testTaskWithDate.name);
console.log('开始时间:', testTaskWithDate.startTime);
console.log('预期结果: 每月 1, 15日 14:30 每2小时');
console.log('实际结果:', result2);
console.log('测试结果:', result2 === '每月 1, 15日 14:30 每2小时' ? '✅ 通过' : '❌ 失败');

console.log('\n=== 测试完成 ===');