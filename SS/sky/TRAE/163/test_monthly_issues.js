// 每月模式问题测试脚本

// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    const conversions = {
        'minute': 60 * 1000,
        'hour': 60 * 60 * 1000,
        'day': 24 * 60 * 60 * 1000
    };
    return value * (conversions[unit] || 60 * 60 * 1000);
}

// 简化的getNextOccurrence函数（仅每月模式）
function getNextOccurrence(task, now) {
    // 解析开始时间
    const startTime = task.startTime || "00:00";
    const [startHour, startMinute] = startTime.split(':').map(Number);

    if (task.recurrence.type === "monthly") {
        // 按日期重复
        if (task.recurrence.days && task.recurrence.days.length > 0) {
            const today = new Date(now);
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const currentDate = today.getDate();
            
            console.log(`计算空间站事件: 当前日期 ${currentYear}-${currentMonth+1}-${currentDate}`);
            
            // 首先检查今天是否是空间站日期
            if (task.recurrence.days.includes(currentDate)) {
                const todayEvent = new Date(currentYear, currentMonth, currentDate, startHour, startMinute);
                const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
                
                // 如果当前时间在事件持续时间内
                if (todayEvent <= now && now < todayEvent.getTime() + durationMs) {
                    console.log(`空间站事件正在进行中: ${todayEvent}`);
                    return {
                        startTime: todayEvent,
                        location: null
                    };
                }
            }
            
            // 检查今天之后的日期
            for (const day of task.recurrence.days) {
                if (day > currentDate) {
                    const candidate = new Date(currentYear, currentMonth, day, startHour, startMinute);
                    if (candidate.getMonth() === currentMonth) {
                        console.log(`找到本月空间站事件: ${candidate}`);
                        return {
                            startTime: candidate,
                            location: null
                        };
                    }
                }
            }
            
            // 如果本月没有符合条件的日期了，找下个月
            const nextMonth = currentMonth + 1;
            const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
            const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
            
            for (const day of task.recurrence.days) {
                const candidate = new Date(nextYear, adjustedMonth, day, startHour, startMinute);
                if (candidate.getMonth() === adjustedMonth) {
                    console.log(`找到下月空间站事件: ${candidate}`);
                    return {
                        startTime: candidate,
                        location: null
                    };
                }
            }
        }
    }
    
    // 默认返回null
    return null;
}

// 测试用例
const testCases = [
    {
        name: "测试1：类型转换问题 - days数组为字符串",
        task: {
            startTime: "09:00",
            recurrence: { type: "monthly", days: [5, 15], duration: 1, durationUnit: "hour" }
        },
        now: new Date("2025-12-03T08:00:00"),
        expectedDate: "2025-12-05",
        description: "测试days数组是否正确处理数字类型"
    },
    {
        name: "测试2：开始日期处理 - task.startDate为未来日期",
        task: {
            startDate: "2025-12-20",
            startTime: "09:00",
            recurrence: { type: "monthly", days: [5, 15], duration: 1, durationUnit: "hour" }
        },
        now: new Date("2025-12-03T08:00:00"),
        expectedDate: "2025-12-20",
        description: "测试task.startDate为未来日期时是否优先使用"
    },
    {
        name: "测试3：多日期判定 - 未排序days数组",
        task: {
            startTime: "09:00",
            recurrence: { type: "monthly", days: [15, 5], duration: 1, durationUnit: "hour" }
        },
        now: new Date("2025-12-03T08:00:00"),
        expectedDate: "2025-12-05",
        description: "测试未排序的days数组是否能正确返回下一个最近的日期"
    },
    {
        name: "测试4：事件当日显示 - 事件进行中",
        task: {
            startTime: "09:00",
            recurrence: { type: "monthly", days: [5, 15], duration: 1, durationUnit: "hour" }
        },
        now: new Date("2025-12-05T09:30:00"),
        expectedDate: "2025-12-05",
        description: "测试事件进行中是否返回当日事件"
    },
    {
        name: "测试5：事件当日显示 - 事件已结束",
        task: {
            startTime: "09:00",
            recurrence: { type: "monthly", days: [5, 15], duration: 1, durationUnit: "hour" }
        },
        now: new Date("2025-12-05T10:30:00"),
        expectedDate: "2025-12-15",
        description: "测试事件结束后是否返回下一个日期"
    },
    {
        name: "测试6：跨月日期处理 - 小月31日",
        task: {
            startTime: "09:00",
            recurrence: { type: "monthly", days: [31], duration: 1, durationUnit: "hour" }
        },
        now: new Date("2025-04-15T08:00:00"),
        expectedDate: "2025-05-31",
        description: "测试跨月日期处理（4月没有31日，应返回5月31日）"
    }
];

// 运行测试
function runTests() {
    const results = [];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n===== ${testCase.name} =====`);
        console.log(`描述: ${testCase.description}`);
        
        // 运行测试
        const result = getNextOccurrence(testCase.task, testCase.now);
        
        // 检查结果
        if (result && result.startTime) {
            const actualDate = result.startTime.toISOString().split('T')[0];
            const expectedDate = testCase.expectedDate;
            const passed = actualDate === expectedDate;
            
            results.push({
                testName: testCase.name,
                passed: passed,
                actual: actualDate,
                expected: expectedDate
            });
            
            console.log(`结果: ${passed ? '通过' : '失败'}`);
            console.log(`实际: ${actualDate}`);
            console.log(`期望: ${expectedDate}`);
        } else {
            results.push({
                testName: testCase.name,
                passed: false,
                actual: 'null',
                expected: testCase.expectedDate
            });
            
            console.log(`结果: 失败`);
            console.log(`实际: null`);
            console.log(`期望: ${testCase.expectedDate}`);
        }
    });
    
    // 输出汇总
    console.log(`\n===== 测试汇总 =====`);
    let passedCount = 0;
    results.forEach(result => {
        console.log(`${result.testName}: ${result.passed ? '通过' : '失败'}`);
        if (result.passed) passedCount++;
    });
    
    console.log(`\n通过: ${passedCount}/${results.length}`);
    
    return results;
}

// 运行测试
runTests();

// 检查是否在浏览器环境中
if (typeof window !== 'undefined' && document) {
    // 如果在浏览器中，将结果显示在页面上
    const testResultsDiv = document.getElementById('test-results');
    if (testResultsDiv) {
        const results = runTests();
        let html = '<h2>每月模式测试结果</h2>';
        
        results.forEach(result => {
            html += `<div class="test-result ${result.passed ? 'passed' : 'failed'}">`;
            html += `<h3>${result.testName}</h3>`;
            html += `<p>实际: ${result.actual}</p>`;
            html += `<p>期望: ${result.expected}</p>`;
            html += `<p>结果: ${result.passed ? '通过' : '失败'}</p>`;
            html += '</div>';
        });
        
        testResultsDiv.innerHTML = html;
    }
}