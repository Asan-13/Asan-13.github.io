// 测试saveData函数的超时机制
console.log('开始测试saveData函数的超时机制...');

// 模拟supabase对象，故意让它在调用时超时
const mockSupabase = {
    from: () => {
        return {
            upsert: () => {
                // 返回一个永远不会resolve的Promise，模拟超时
                return new Promise(() => {
                    // 空的Promise，永远不会完成
                });
            },
            select: function() {
                return this;
            }
        };
    }
};

// 模拟localStorage
const mockLocalStorage = {
    _data: {},
    setItem: function(key, value) {
        this._data[key] = value;
        console.log('localStorage.setItem:', key, value);
    },
    getItem: function(key) {
        return this._data[key];
    }
};

// 模拟showNotification函数
const mockShowNotification = (message, isError = false) => {
    console.log(`通知: ${message} ${isError ? '(错误)' : ''}`);
};

// 保存原始对象，测试完成后恢复
default = {
    localStorage: window.localStorage,
    showNotification: window.showNotification,
    supabase: window.supabase
};

// 替换为模拟对象
window.localStorage = mockLocalStorage;
window.showNotification = mockShowNotification;
window.supabase = mockSupabase;

// 测试数据
const testData = [
    {
        id: 1,
        name: '测试任务1',
        startDate: '2024-06-01',
        startTime: '10:00',
        displayThreshold: 10,
        displayThresholdUnit: 'minutes',
        priority: 1,
        recurrence: { type: 'daily', duration: 30, durationUnit: 'minutes' }
    }
];

// 测试saveData函数
async function runTest() {
    console.log('准备调用saveData函数...');
    const startTime = Date.now();
    
    // 调用saveData函数
    try {
        const result = await window.saveData(testData);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`saveData函数调用完成，耗时: ${duration}ms`);
        console.log(`saveData函数返回值: ${result}`);
        
        // 检查localStorage是否保存成功
        const savedData = JSON.parse(mockLocalStorage.getItem('timeProjectReminderTasks_163'));
        console.log('localStorage中保存的数据:', savedData);
        
        if (savedData && savedData.length > 0) {
            console.log('✅ 测试通过: localStorage保存成功');
        } else {
            console.log('❌ 测试失败: localStorage保存失败');
        }
        
        if (duration < 10000 && result === true) {
            console.log('✅ 测试通过: saveData函数在超时机制下正常返回');
        } else {
            console.log('❌ 测试失败: saveData函数可能没有正确处理超时');
        }
        
    } catch (error) {
        console.error('❌ 测试失败: saveData函数抛出异常', error);
    }
    
    // 恢复原始对象
    window.localStorage = default.localStorage;
    window.showNotification = default.showNotification;
    window.supabase = default.supabase;
}

// 运行测试
runTest();