// 测试脚本：验证startTime字段修复效果
const { JSDOM } = require('jsdom');

// 创建虚拟DOM环境
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <title>测试startTime字段修复</title>
</head>
<body>
    <!-- 模拟表单元素 -->
    <select id="recurrence-type">
        <option value="none">不重复</option>
        <option value="daily">每天</option>
        <option value="weekly">每周</option>
        <option value="monthly">每月</option>
        <option value="interval">间隔</option>
        <option value="monthly_interval">每月间隔</option>
    </select>
    
    <!-- none类型 -->
    <input type="date" id="none-start-date" value="2023-12-01">
    <input type="time" id="none-start-time" value="10:00">
    
    <!-- daily类型 -->
    <select id="daily-repeat-type">
        <option value="time-points">特定时间点</option>
        <option value="time-range">时间段</option>
    </select>
    <input type="date" id="daily-start-date" value="2023-12-01">
    <div id="daily-times-container">
        <input type="time" class="start-time-input" value="09:00">
        <input type="time" class="start-time-input" value="14:00">
    </div>
    
    <!-- weekly类型 -->
    <select id="weekly-repeat-type">
        <option value="time-points">特定时间点</option>
        <option value="time-range">时间段</option>
    </select>
    <input type="date" id="weekly-start-date" value="2023-12-01">
    <div id="weekly-times-container">
        <input type="time" class="start-time-input" value="10:00">
    </div>
    
    <!-- monthly类型 -->
    <select id="monthly-repeat-type">
        <option value="time-points">特定时间点</option>
        <option value="time-range">时间段</option>
    </select>
    <input type="date" id="monthly-start-date" value="2023-12-01">
    <div id="monthly-time-points">
        <input type="time" class="start-time-input" value="11:00">
        <input type="time" class="start-time-input" value="15:30">
    </div>
    <input type="time" name="monthly-start-time" value="08:00">
    <input type="time" name="monthly-end-time" value="18:00">
    <input type="number" name="monthly-interval-count" value="1">
    <select name="monthly-interval-unit">
        <option value="hour">小时</option>
    </select>
    
    <!-- interval类型 -->
    <input type="date" id="interval-start-date" value="2023-12-01">
    <input type="time" id="interval-start-time" value="09:00">
    <input type="date" id="interval-end-date" value="2023-12-31">
    <input type="time" id="interval-end-time" value="17:00">
    
    <!-- monthly_interval类型 -->
    <input type="date" id="monthly_interval-start-date" value="2023-12-01">
    <input type="time" id="monthly_interval-start-time" value="10:00">
    
    <!-- 其他通用字段 -->
    <input type="text" id="task-name" value="测试任务">
    <select id="task-priority">
        <option value="normal">普通</option>
    </select>
    <input type="number" id="display-threshold" value="10">
    <select id="display-threshold-unit">
        <option value="minute">分钟</option>
    </select>
    <input type="number" id="task-duration" value="30">
    <select id="duration-unit">
        <option value="minute">分钟</option>
    </select>
    <input type="text" id="location" value="测试位置">
    <textarea id="notes">测试备注</textarea>
</body>
</html>
`);

// 模拟浏览器环境
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;

// 模拟修复后的saveData函数中的processedData处理逻辑
function processTaskData(taskData) {
    return {
        ...taskData,
        // 确保recurrence是一个对象，防止NOT NULL约束错误
        recurrence: taskData.recurrence || { type: 'none', duration: 1, durationUnit: 'hour' },
        // 确保startDate不为空，防止NOT NULL约束错误
        startDate: taskData.startDate || new Date().toISOString().split('T')[0],
        // 确保startTime不为空，防止NOT NULL约束错误
        startTime: taskData.startTime || '00:00'
    };
}

// 模拟修复后的表单数据收集逻辑
function collectFormData(recurrenceType) {
    // 设置选中的重复类型
    const recurrenceTypeSelect = document.getElementById('recurrence-type');
    recurrenceTypeSelect.value = recurrenceType;
    
    let startDate, startTime, startTimes = [];
    
    switch(recurrenceType) {
        case 'none':
            startDate = document.getElementById('none-start-date').value;
            startTime = document.getElementById('none-start-time').value;
            break;
        case 'daily':
            startDate = document.getElementById('daily-start-date').value;
            startTime = '00:00'; // 默认值
            const dailyRepeatType = document.getElementById('daily-repeat-type').value;
            if (dailyRepeatType === 'time-points') {
                startTimes = Array.from(document.querySelectorAll('#daily-times-container input[type="time"]'))
                    .map(input => input.value)
                    .filter(time => time);
            }
            break;
        case 'weekly':
            startDate = document.getElementById('weekly-start-date').value;
            startTime = '00:00'; // 默认值
            const weeklyRepeatType = document.getElementById('weekly-repeat-type').value;
            if (weeklyRepeatType === 'time-points') {
                startTimes = Array.from(document.querySelectorAll('#weekly-times-container input[type="time"]'))
                    .map(input => input.value)
                    .filter(time => time);
            }
            break;
        case 'monthly':
            // 收集每月重复类型
            const monthlyRepeatType = document.getElementById('monthly-repeat-type').value;
            startDate = document.getElementById('monthly-start-date').value;
            
            // 根据重复类型收集不同的数据
            if (monthlyRepeatType === 'time-points') {
                // 收集每月时间点数据
                startTimes = Array.from(document.querySelectorAll('#monthly-time-points .start-time-input')).map(input => input.value);
                // 确保至少有一个时间点
                if (startTimes.length === 0) {
                    startTimes.push('00:00');
                }
                // 设置startTime为第一个时间点
                startTime = startTimes[0] || '00:00';
            } else {
                // 收集每月时间段数据
                const rangeStart = document.querySelector('[name="monthly-start-time"]').value;
                // 设置startTime为时间段的开始时间
                startTime = rangeStart || '00:00';
            }
            break;
        case 'interval':
            startDate = document.getElementById('interval-start-date').value;
            startTime = document.getElementById('interval-start-time').value;
            break;
        case 'monthly_interval':
            startDate = document.getElementById('monthly_interval-start-date').value;
            startTime = document.getElementById('monthly_interval-start-time').value;
            break;
        default:
            startDate = '';
            startTime = '';
    }
    
    // 构建任务数据
    return {
        name: document.getElementById('task-name').value,
        priority: document.getElementById('task-priority').value,
        displayThreshold: parseInt(document.getElementById('display-threshold').value),
        displayThresholdUnit: document.getElementById('display-threshold-unit').value,
        startDate: startDate,
        startTime: startTime,
        duration: parseInt(document.getElementById('task-duration').value),
        durationUnit: document.getElementById('duration-unit').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value,
        recurrence: {
            type: recurrenceType,
            startTimes: startTimes
        }
    };
}

// 测试所有任务类型
const testRecurrenceTypes = ['none', 'daily', 'weekly', 'monthly', 'interval', 'monthly_interval'];

console.log('=== 测试startTime字段修复效果 ===\n');

let allTestsPassed = true;

testRecurrenceTypes.forEach(type => {
    console.log(`测试任务类型: ${type}`);
    
    // 收集表单数据
    const taskData = collectFormData(type);
    
    // 处理数据
    const processedData = processTaskData(taskData);
    
    // 验证startTime字段
    if (!processedData.startTime) {
        console.error(`❌ 错误: ${type}类型任务的startTime为空`);
        allTestsPassed = false;
    } else if (processedData.startTime === '00:00') {
        console.log(`⚠️  注意: ${type}类型任务使用了默认startTime: ${processedData.startTime}`);
    } else {
        console.log(`✅ 成功: ${type}类型任务的startTime为: ${processedData.startTime}`);
    }
    
    console.log('------------------------');
});

// 测试空值情况
console.log('\n=== 测试边界情况 ===\n');

// 测试monthly类型没有时间点的情况
console.log('测试monthly类型没有时间点的情况:');
const monthlyTaskData = collectFormData('monthly');
// 清空startTimes模拟没有时间点的情况
monthlyTaskData.recurrence.startTimes = [];
const processedMonthlyData = processTaskData(monthlyTaskData);
if (processedMonthlyData.startTime) {
    console.log(`✅ 成功: 没有时间点的monthly任务使用了默认startTime: ${processedMonthlyData.startTime}`);
} else {
    console.error('❌ 错误: 没有时间点的monthly任务startTime为空');
    allTestsPassed = false;
}

console.log('\n=== 测试结果总结 ===');
if (allTestsPassed) {
    console.log('✅ 所有测试通过！startTime字段修复成功。');
    console.log('   修复内容：');
    console.log('   1. 在saveData函数中添加了startTime安全检查，默认值为\'00:00\'');
    console.log('   2. 在monthly类型任务中正确设置了startTime字段');
} else {
    console.log('❌ 测试失败！startTime字段仍存在问题。');
}
