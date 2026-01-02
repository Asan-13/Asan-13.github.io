// 黑石事件规则
const blackstoneRules = {
    group1: {
        days: [2, 6, 10, 14, 18, 22, 26, 30],
        cancelDays: [0, 1], // 周日、周一取消
        timeSlots: [
            { start: "17:18", end: "21:10" },
            { start: "01:18", end: "05:10" },
            { start: "09:18", end: "13:10" }
        ]
    },
    group2: {
        days: [4, 8, 12, 16, 20, 24, 28],
        cancelDays: [6, 0], // 周六、周日取消
        timeSlots: [
            { start: "16:58", end: "20:50" },
            { start: "00:58", end: "04:50" },
            { start: "08:58", end: "12:50" }
        ]
    }
};

// 地点映射
const locationMap = {
    blackstone: {
        2: { area: "雨林", name: "埋骨之地" },
        4: { area: "暮土", name: "破旧神庙" },
        6: { area: "云野", name: "云野村庄" },
        8: { area: "霞谷", name: "滑冰场" },
        10: { area: "禁阁", name: "星漠" },
        12: { area: "雨林", name: "雨林小溪" },
        14: { area: "暮土", name: "暮土战场" },
        16: { area: "云野", name: "蝴蝶平原" },
        18: { area: "霞谷", name: "滑冰场" },
        20: { area: "禁阁", name: "星漠" },
        22: { area: "雨林", name: "埋骨之地" },
        24: { area: "暮土", name: "破旧神庙" },
        26: { area: "云野", name: "云野村庄" },
        28: { area: "霞谷", name: "滑冰场" },
        30: { area: "禁阁", name: "星漠" }
    }
};

// 生成12月的所有日期
const decemberDates = [];
for (let day = 1; day <= 31; day++) {
    decemberDates.push(day);
}

// 检查日期是否有效
function isValidBlackstoneEvent(year, month, day) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六
    
    // 检查group1
    if (blackstoneRules.group1.days.includes(day)) {
        if (!blackstoneRules.group1.cancelDays.includes(dayOfWeek)) {
            return { valid: true, group: 'group1', dayOfWeek: dayOfWeek };
        }
    }
    
    // 检查group2
    if (blackstoneRules.group2.days.includes(day)) {
        if (!blackstoneRules.group2.cancelDays.includes(dayOfWeek)) {
            return { valid: true, group: 'group2', dayOfWeek: dayOfWeek };
        }
    }
    
    return { valid: false, dayOfWeek: dayOfWeek };
}

// 生成12月的所有黑石事件
function generateBlackstoneEvents() {
    const year = 2025;
    const month = 12;
    const events = [];
    
    for (const day of decemberDates) {
        const result = isValidBlackstoneEvent(year, month, day);
        if (result.valid) {
            const group = blackstoneRules[result.group];
            const location = locationMap.blackstone[day];
            const date = new Date(year, month - 1, day);
            
            // 添加事件
            events.push({
                date: day,
                dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][result.dayOfWeek],
                group: result.group,
                location: location,
                timeSlots: group.timeSlots
            });
        }
    }
    
    return events;
}

// 显示结果
function displayEvents() {
    const events = generateBlackstoneEvents();
    
    console.log('=== 2025年12月黑石事件列表 ===\n');
    
    if (events.length === 0) {
        console.log('12月没有有效的黑石事件');
        return;
    }
    
    events.forEach((event, index) => {
        console.log(`事件 ${index + 1}:`);
        console.log(`日期：12月${event.date}日 ${event.dayOfWeek}`);
        console.log(`组别：${event.group}`);
        console.log(`地点：${event.location.area}-${event.location.name}`);
        console.log('时间段：');
        event.timeSlots.forEach((slot, slotIndex) => {
            console.log(`  ${slotIndex + 1}. ${slot.start} - ${slot.end}`);
        });
        console.log('');
    });
    
    console.log(`总计：${events.length}个有效事件`);
}

// 运行脚本
displayEvents();
