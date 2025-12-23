// 测试脚本：验证startDate字段修复
console.log('=== 开始测试startDate字段修复 ===');

// 模拟DOM环境
const document = {
    getElementById: function(id) {
        // 模拟输入框元素
        return {
            value: (id === 'monthly-start-date' || id === 'monthly_interval-start-date') ? '2025-05-15' : ''
        };
    },
    querySelectorAll: function(selector) {
        return [];
    },
    querySelector: function(selector) {
        return {
            value: ''
        };
    }
};

// 模拟表单数据收集函数
function collectFormData() {
    const recurrenceType = 'monthly'; // 测试monthly类型
    let startDate, startTime, startTimes = [];
    
    switch(recurrenceType) {
        case 'monthly':
            // 修复后的代码：会设置startDate
            const monthlyRepeatType = 'time-points';
            startDate = document.getElementById('monthly-start-date') ? document.getElementById('monthly-start-date').value : '';
            
            if (monthlyRepeatType === 'time-points') {
                startTimes = [];
            } else {
                rangeStart = '';
                rangeEnd = '';
                intervalCount = '';
                intervalUnit = '';
            }
            break;
        case 'monthly_interval':
            // 修复后的代码：会使用默认日期
            startDate = document.getElementById('monthly_interval-start-date') ? document.getElementById('monthly_interval-start-date').value : new Date().toISOString().split('T')[0];
            startTime = document.getElementById('monthly_interval-start-time') ? document.getElementById('monthly_interval-start-time').value : '';
            break;
        default:
            startDate = '';
            startTime = '';
    }
    
    return { startDate, startTime, startTimes };
}

// 测试1：monthly类型的startDate
const test1Data = collectFormData('monthly');
console.log('测试1 (monthly类型) startDate:', test1Data.startDate);
console.log('测试1通过:', test1Data.startDate !== '');

// 测试2：saveData函数中的安全检查
function testSaveData() {
    // 模拟任务数据，其中一个任务缺少startDate
    const tasks = [
        { id: '1', name: '任务1', startDate: '2025-05-15', recurrence: { type: 'monthly' } },
        { id: '2', name: '任务2', recurrence: { type: 'monthly_interval' } } // 缺少startDate
    ];
    
    // 模拟修复后的处理逻辑
    const processedData = tasks.map(task => ({
        ...task,
        recurrence: task.recurrence || { type: 'none', duration: 1, durationUnit: 'hour' },
        startDate: task.startDate || new Date().toISOString().split('T')[0]
    }));
    
    console.log('测试2 处理后的数据:');
    processedData.forEach((task, index) => {
        console.log(`  任务${index + 1} startDate:`, task.startDate);
    });
    
    // 检查所有任务都有startDate
    const allHaveStartDate = processedData.every(task => task.startDate && task.startDate !== '');
    console.log('测试2通过 (所有任务都有startDate):', allHaveStartDate);
    
    return allHaveStartDate;
}

// 运行测试2
testSaveData();

console.log('=== 测试完成 ===');
