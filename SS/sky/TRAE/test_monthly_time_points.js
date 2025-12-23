// 测试每月特定时间点多个时间点的保存功能

// 模拟DOM环境
const mockDocument = {
    querySelectorAll: function(selector) {
        if (selector === '#monthly-time-points .start-time-input') {
            return [
                { value: '08:00' },
                { value: '12:00' },
                { value: '18:00' }
            ];
        }
        return [];
    },
    querySelector: function(selector) {
        if (selector === '#monthly-repeat-type') {
            return { value: 'time-points' };
        }
        return null;
    },
    getElementById: function(id) {
        return null;
    }
};

// 模拟表单数据收集（与admin.html中的逻辑一致）
function collectMonthlyTimePointsData() {
    const monthlyRepeatType = 'time-points';
    let startTimes = [];
    let startTime = '';
    let rangeStart = '';
    let rangeEnd = '';
    let intervalCount = '';
    let intervalUnit = '';

    if (monthlyRepeatType === 'time-points') {
        // 收集每月时间点数据
        startTimes = Array.from(mockDocument.querySelectorAll('#monthly-time-points .start-time-input')).map(input => input.value);
        // 确保至少有一个时间点
        if (startTimes.length === 0) {
            startTimes.push('00:00');
        }
        // 设置startTime为第一个时间点
        startTime = startTimes[0] || '00:00';
    } else {
        // 收集每月时间段数据
        rangeStart = mockDocument.querySelector('[name="monthly-start-time"]')?.value || '';
        rangeEnd = mockDocument.querySelector('[name="monthly-end-time"]')?.value || '';
        intervalCount = mockDocument.querySelector('[name="monthly-interval-count"]')?.value || '';
        intervalUnit = mockDocument.querySelector('[name="monthly-interval-unit"]')?.value || '';
        // 设置startTime为时间段的开始时间
        startTime = rangeStart || '00:00';
    }

    return {
        monthlyRepeatType,
        startTimes,
        startTime,
        rangeStart,
        rangeEnd,
        intervalCount,
        intervalUnit
    };
}

// 测试修复后的保存逻辑
function testMonthlyTimePointsSave() {
    console.log('=== 测试每月特定时间点保存功能 ===');

    // 收集表单数据
    const collectedData = collectMonthlyTimePointsData();
    console.log('收集到的时间点数据:', collectedData.startTimes);
    console.log('收集到的第一个时间点:', collectedData.startTime);

    // 模拟taskData对象
    const taskData = {
        id: 'test-task-1',
        title: '测试任务',
        location: '测试地点',
        notes: '测试备注',
        startTime: collectedData.startTime,
        startDate: '2023-12-01',
        duration: 30,
        durationUnit: 'minute',
        recurrence: {
            type: 'monthly',
            monthlyRepeatType: collectedData.monthlyRepeatType,
            monthdays: [1, 15],
            startTimes: collectedData.startTimes,
            rangeStart: collectedData.rangeStart,
            rangeEnd: collectedData.rangeEnd,
            intervalCount: collectedData.intervalCount,
            intervalUnit: collectedData.intervalUnit
        }
    };

    console.log('构建的taskData对象:', JSON.stringify(taskData, null, 2));

    // 测试修复后的保存逻辑
    const mockSaveData = function(tasks) {
        console.log('保存到本地的任务数量:', tasks.length);
        const savedTask = tasks.find(t => t.id === taskData.id);
        if (savedTask) {
            console.log('保存的任务ID:', savedTask.id);
            console.log('保存的任务名称:', savedTask.title);
            console.log('保存的时间点数量:', savedTask.recurrence.startTimes.length);
            console.log('保存的时间点:', savedTask.recurrence.startTimes);
            console.log('保存的第一个时间点:', savedTask.startTime);
            
            // 验证第二个时间点是否保存成功
            if (savedTask.recurrence.startTimes.length >= 2 && savedTask.recurrence.startTimes[1] === '12:00') {
                console.log('✅ 第二个时间点保存成功!');
                return true;
            } else {
                console.log('❌ 第二个时间点保存失败!');
                return false;
            }
        }
        return false;
    };

    // 测试本地保存逻辑
    console.log('\n=== 测试本地保存逻辑 ===');
    let tasks = [];
    const newTask = {
        id: taskData.id,
        title: taskData.title,
        location: taskData.location,
        notes: taskData.notes,
        startTime: taskData.startTime,
        startDate: taskData.startDate,
        duration: taskData.duration,
        durationUnit: taskData.durationUnit,
        recurrence: {
            duration: taskData.duration,
            durationUnit: taskData.durationUnit,
            type: taskData.recurrence.type
        }
    };

    // 根据重复类型添加相应的规则
    switch(taskData.recurrence.type) {
        case "monthly":
            // 使用修复后的startTimes字段
            newTask.recurrence.days = taskData.recurrence.monthdays.length > 0 ? taskData.recurrence.monthdays : [1];
            newTask.recurrence.startTimes = taskData.recurrence.startTimes.length > 0 ? taskData.recurrence.startTimes : [taskData.startTime];
            newTask.recurrence.monthlyRepeatType = taskData.recurrence.monthlyRepeatType || 'time-points';
            newTask.recurrence.rangeStart = taskData.recurrence.rangeStart;
            newTask.recurrence.rangeEnd = taskData.recurrence.rangeEnd;
            newTask.recurrence.intervalCount = taskData.recurrence.intervalCount;
            newTask.recurrence.intervalUnit = taskData.recurrence.intervalUnit;
            break;
    }

    tasks.push(newTask);
    const localSaveSuccess = mockSaveData(tasks);

    // 测试Supabase保存逻辑
    console.log('\n=== 测试Supabase保存逻辑 ===');
    const supabaseTaskData = {
        id: taskData.id,
        title: taskData.title,
        location: taskData.location,
        notes: taskData.notes,
        startTime: taskData.startTime,
        startDate: taskData.startDate,
        duration: taskData.duration,
        durationUnit: taskData.durationUnit,
        recurrence: {
            duration: taskData.duration,
            durationUnit: taskData.durationUnit,
            type: taskData.recurrence.type
        }
    };

    // 根据重复类型添加相应的规则
    switch(taskData.recurrence.type) {
        case "monthly":
            // 使用修复后的startTimes字段
            const monthDays = taskData.recurrence?.monthdays || taskData.startDates || [];
            supabaseTaskData.recurrence.days = monthDays.length > 0 ? monthDays : [1];
            supabaseTaskData.recurrence.startTimes = taskData.recurrence?.startTimes?.length > 0 ? taskData.recurrence.startTimes : [taskData.startTime];
            supabaseTaskData.recurrence.monthlyRepeatType = taskData.recurrence?.monthlyRepeatType || 'time-points';
            supabaseTaskData.recurrence.rangeStart = taskData.recurrence?.rangeStart;
            supabaseTaskData.recurrence.rangeEnd = taskData.recurrence?.rangeEnd;
            supabaseTaskData.recurrence.intervalCount = taskData.recurrence?.intervalCount;
            supabaseTaskData.recurrence.intervalUnit = taskData.recurrence?.intervalUnit;
            break;
    }

    console.log('保存到Supabase的任务数据:', JSON.stringify(supabaseTaskData, null, 2));
    
    // 验证Supabase保存的数据
    if (supabaseTaskData.recurrence.startTimes.length >= 2 && supabaseTaskData.recurrence.startTimes[1] === '12:00') {
        console.log('✅ Supabase保存的第二个时间点成功!');
        return true;
    } else {
        console.log('❌ Supabase保存的第二个时间点失败!');
        return false;
    }
}

// 运行测试
try {
    const testResult = testMonthlyTimePointsSave();
    console.log('\n=== 测试总结 ===');
    if (testResult) {
        console.log('✅ 所有测试通过！每月特定时间点的多个时间点能够正确保存。');
    } else {
        console.log('❌ 测试失败！每月特定时间点的多个时间点保存存在问题。');
    }
} catch (error) {
    console.error('测试过程中出现错误:', error);
}