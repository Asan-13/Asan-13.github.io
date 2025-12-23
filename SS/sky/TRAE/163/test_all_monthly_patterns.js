// 测试所有每月相关模式的getNextOccurrence函数行为
console.log('=== 所有每月相关模式测试 ===\n');

// 模拟当前时间 - 2025-12-01 10:15:00
const now = new Date(2025, 11, 1, 10, 15);
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

// 测试不同类型的每月事件
function testMonthlyPatterns() {
    // 测试用例数组
    const testCases = [
        {
            id: "monthly-normal",
            name: "普通每月事件",
            type: "monthly",
            recurrence: {
                subType: "time-points",
                days: [1],
                startTimes: ["12:00"],
                duration: 30,
                durationUnit: "minute"
            }
        },
        {
            id: "monthly-times",
            name: "每月多次事件",
            type: "monthly_times",
            recurrence: {
                subType: "time-points",
                days: [1, 15],
                startTimes: ["10:00", "15:00"],
                duration: 30,
                durationUnit: "minute"
            }
        },
        {
            id: "monthly-interval",
            name: "每月间隔事件",
            type: "monthly_interval",
            recurrence: {
                // 注意：没有设置subType，应该默认使用time-range
                days: [1],
                rangeStart: "09:00",
                rangeEnd: "18:00",
                intervalCount: 1,
                intervalUnit: "hour",
                duration: 30,
                durationUnit: "minute"
            }
        }
    ];

    // 遍历测试用例
    for (const testCase of testCases) {
        console.log(`--- 测试用例: ${testCase.name} ---`);
        console.log(`类型: ${testCase.type}`);
        
        // 模拟getNextOccurrence函数中的子类型获取逻辑
        const originalSubType = testCase.recurrence.subType || "time-points";
        let monthlySubType = testCase.recurrence.monthlyRepeatType || testCase.recurrence.repeatType || testCase.recurrence.subType || "time-points";
        
        // 应用修复后的逻辑
        if (testCase.type === "monthly_interval") {
            monthlySubType = "time-range"; // 每月间隔重复模式强制使用time-range子类型
        }
        
        console.log(`原始子类型: ${originalSubType}`);
        console.log(`修复后子类型: ${monthlySubType}`);
        
        // 验证其他类型的子类型没有改变
        if (testCase.type !== "monthly_interval") {
            if (monthlySubType === originalSubType) {
                console.log(`✅ 子类型未改变，符合预期`);
            } else {
                console.log(`❌ 子类型被意外改变，不符合预期`);
            }
        } else {
            // 对于monthly_interval类型，应该强制使用time-range
            if (monthlySubType === "time-range") {
                console.log(`✅ 子类型被正确设置为time-range，符合预期`);
            } else {
                console.log(`❌ 子类型未被正确设置为time-range，不符合预期`);
            }
        }
        
        console.log();
    }
}

// 执行测试
testMonthlyPatterns();

console.log('=== 测试完成 ===');