// 测试最终修复后的天数差计算

// 模拟PacificTimeUtils
const PacificTimeUtils = {
    getCurrentPacificTime() {
        // 模拟当前太平洋时间为2025-12-28 02:25:00（冬令时）
        return new Date(Date.UTC(2025, 11, 28, 10, 25, 0, 0));
    },
    isPDT(date = new Date()) {
        return false; // 12月是冬令时
    }
};

// 模拟修复后的TimeZoneUtils
const TimeZoneUtils = {
    PDTtoCST(pdtDate) {
        // pdtDate是一个包含太平洋时间的Date对象，其内部存储的是UTC时间
        // 北京时间是UTC+8，所以直接将UTC时间转换为北京时间
        const utcTime = pdtDate.getTime();
        // 北京时间 = UTC时间 + 8小时
        return new Date(utcTime + 8 * 60 * 60 * 1000);
    }
};

// 模拟当前时间：2025-12-28 10:25（北京时间）
const now = new Date('2025-12-28T10:25:00+08:00');
console.log('当前北京时间:', now.toLocaleString('zh-CN'));
console.log('当前UTC时间:', now.toISOString());

// 模拟太平洋时间：2025-12-30 02:18（冬令时）
// 内部UTC时间：2025-12-30T10:18:00.000Z
const pdtEvent = new Date(Date.UTC(2025, 11, 30, 10, 18, 0, 0));
console.log('\n太平洋时间事件:', pdtEvent.toLocaleString('zh-CN', { timeZone: 'America/Los_Angeles' }));
console.log('太平洋时间事件（UTC）:', pdtEvent.toISOString());

// 使用修复后的函数转换
const cstEvent = TimeZoneUtils.PDTtoCST(pdtEvent);
console.log('\n修复后转换的北京时间:', cstEvent.toLocaleString('zh-CN'));
console.log('修复后转换的北京时间（UTC）:', cstEvent.toISOString());

// 计算天数差
const todayOnly = new Date(now);
todayOnly.setHours(0, 0, 0, 0);
const eventDateOnly = new Date(cstEvent);
eventDateOnly.setHours(0, 0, 0, 0);

console.log('\n日期比较:');
console.log('今天日期:', todayOnly.toLocaleDateString('zh-CN'));
console.log('事件日期:', eventDateOnly.toLocaleDateString('zh-CN'));

const timeDiff = eventDateOnly - todayOnly;
const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

console.log('\n天数差计算:');
console.log('时间差:', timeDiff, '毫秒');
console.log('天数差:', dayDiff, '天');

// 显示文本
let dayText;
if (dayDiff === 0) {
    dayText = '今天';
} else if (dayDiff === 1) {
    dayText = '明天';
} else if (dayDiff === 2) {
    dayText = '后天';
} else {
    dayText = `${dayDiff}天后`;
}

console.log('\n=== 最终测试结果 ===');
console.log(`显示文本: ${dayText}`);
console.log(`是否正确: ${dayText === '后天' ? '✅ 正确' : '❌ 不正确'}`);
console.log(`预期显示: 后天`);

// 模拟完整的getNearestEvent函数逻辑
console.log('\n=== 模拟完整getNearestEvent函数 ===');

// 模拟事件
const mockEvent = {
    date: pdtEvent,
    timeSlots: [{ start: '02:18', end: '06:10' }],
    location: { area: '测试', name: '测试地点' }
};

function simulateGetNearestEvent() {
    const today = now;
    
    // 遍历时间槽，找到第一个未过去的时间槽
    let firstFutureSlot = null;
    let firstFutureSlotCST = null;
    
    for (const timeSlot of mockEvent.timeSlots) {
        const [startHourPDT, startMinutePDT] = timeSlot.start.split(':').map(Number);
        
        console.log('\n处理时间槽:', timeSlot.start);
        
        // 创建太平洋时间的时间槽开始时间
        // 注意：mockEvent.date的内部是UTC时间，代表太平洋时间
        // 我们需要创建一个新的Date对象，其UTC时间对应太平洋时间的startHourPDT:startMinutePDT
        // 太平洋时间 = UTC时间 - 8小时（冬令时）
        // 所以UTC时间 = 太平洋时间 + 8小时
        const slotStartUTC = Date.UTC(
            mockEvent.date.getUTCFullYear(),
            mockEvent.date.getUTCMonth(),
            mockEvent.date.getUTCDate(),
            startHourPDT + 8,
            startMinutePDT,
            0,
            0
        );
        
        const slotStartPDT = new Date(slotStartUTC);
        
        console.log('  太平洋时间:', slotStartPDT.toLocaleString('zh-CN', { timeZone: 'America/Los_Angeles' }));
        console.log('  UTC时间:', slotStartPDT.toISOString());
        
        // 转换为北京时间
        const slotStartCST = TimeZoneUtils.PDTtoCST(slotStartPDT);
        console.log('  北京时间:', slotStartCST.toLocaleString('zh-CN'));
        
        // 如果这个时间槽还没过去，就使用它
        if (slotStartCST > today) {
            firstFutureSlot = timeSlot;
            firstFutureSlotCST = slotStartCST;
            break;
        }
    }
    
    let dayText;
    
    if (firstFutureSlotCST) {
        // 重置时间，只比较日期部分
        const todayOnly = new Date(today);
        todayOnly.setHours(0, 0, 0, 0);
        
        const eventDateOnly = new Date(firstFutureSlotCST);
        eventDateOnly.setHours(0, 0, 0, 0);
        
        // 计算相差天数
        const timeDiff = eventDateOnly - todayOnly;
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (dayDiff === 0) {
            dayText = '今天';
        } else if (dayDiff === 1) {
            dayText = '明天';
        } else if (dayDiff === 2) {
            dayText = '后天';
        } else {
            dayText = `${dayDiff}天后`;
        }
    } else {
        dayText = '暂无';
    }
    
    return {
        dayText: dayText,
        firstFutureSlotCST: firstFutureSlotCST
    };
}

const fullResult = simulateGetNearestEvent();
console.log('\n=== 完整函数测试结果 ===');
console.log(`显示文本: ${fullResult.dayText}`);
console.log(`是否正确: ${fullResult.dayText === '后天' ? '✅ 正确' : '❌ 不正确'}`);
console.log(`预期显示: 后天`);

if (fullResult.firstFutureSlotCST) {
    console.log(`事件北京时间: ${fullResult.firstFutureSlotCST.toLocaleString('zh-CN')}`);
}
