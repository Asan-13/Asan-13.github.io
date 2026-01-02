// 精确测试黑石按钮显示的天数差
const TimeZoneUtils = {
    PDTtoCST(pdtDate) {
        // 固定使用+16小时偏移量，因为12月是冬令时（PST）
        const offsetHours = 16;
        return new Date(pdtDate.getTime() + offsetHours * 60 * 60 * 1000);
    }
};

// 模拟浏览器环境中的new Date()行为
// 今天是2025-12-28 10:25（北京时间）
const today = new Date('2025-12-28T10:25:00+08:00');
console.log('当前北京时间:', today.toLocaleString('zh-CN'));
console.log('当前UTC时间:', today.toISOString());

// 下个黑石事件：12月30日太平洋时间02:18
// 太平洋时间（冬令时）：UTC-8
// 所以UTC时间：2025-12-30T10:18:00Z
// 北京时间（UTC+8）：2025-12-30T18:18:00+08:00
const pdtEvent = new Date('2025-12-30T02:18:00-08:00');
console.log('\n太平洋时间事件:', pdtEvent.toLocaleString('zh-CN'));
console.log('太平洋时间事件（UTC）:', pdtEvent.toISOString());

// 使用TimeZoneUtils转换
const cstEvent = TimeZoneUtils.PDTtoCST(pdtEvent);
console.log('\n转换后的北京时间事件:', cstEvent.toLocaleString('zh-CN'));
console.log('转换后的北京时间事件（UTC）:', cstEvent.toISOString());

// 重置时间，只比较日期部分
const todayOnly = new Date(today);
todayOnly.setHours(0, 0, 0, 0);
const eventDateOnly = new Date(cstEvent);
eventDateOnly.setHours(0, 0, 0, 0);

console.log('\n只比较日期部分:');
console.log('今天日期:', todayOnly.toLocaleDateString('zh-CN'));
console.log('事件日期:', eventDateOnly.toLocaleDateString('zh-CN'));

// 计算相差天数
const timeDiff = eventDateOnly - todayOnly;
console.log('\n时间差:', timeDiff, '毫秒');

// 计算天数差
const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
console.log('天数差（Math.ceil）:', dayDiff, '天');

// 直接计算天数
const directDayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
console.log('天数差（Math.floor）:', directDayDiff, '天');

// 使用日期对象的getDate()方法计算
const todayDate = todayOnly.getDate();
const eventDate = eventDateOnly.getDate();
const dateDiff = eventDate - todayDate;
console.log('\n直接日期差:', dateDiff, '天');

// 测试不同的计算方法
console.log('\n=== 不同计算方法结果 ===');

// 方法1：使用UTC时间
const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
const eventUTC = Date.UTC(cstEvent.getFullYear(), cstEvent.getMonth(), cstEvent.getDate());
const diffUTC = eventUTC - todayUTC;
const dayDiffUTC = diffUTC / (1000 * 3600 * 24);
console.log('UTC方法天数差:', dayDiffUTC, '天');

// 方法2：使用toDateString()比较
const todayStr = todayOnly.toDateString();
const eventStr = eventDateOnly.toDateString();
console.log('日期字符串比较:', todayStr, 'vs', eventStr);

// 方法3：使用getTime()直接计算
const todayTime = todayOnly.getTime();
const eventTime = eventDateOnly.getTime();
const diffTime = eventTime - todayTime;
const dayDiffTime = diffTime / (1000 * 3600 * 24);
console.log('getTime方法天数差:', dayDiffTime, '天');
console.log('getTime方法天数差（Math.ceil）:', Math.ceil(dayDiffTime), '天');
console.log('getTime方法天数差（Math.floor）:', Math.floor(dayDiffTime), '天');
console.log('getTime方法天数差（Math.round）:', Math.round(dayDiffTime), '天');

// 模拟代码中的逻辑
console.log('\n=== 模拟代码中的逻辑 ===');
const codeToday = new Date();
codeToday.setFullYear(2025, 11, 28); // 12月28日
codeToday.setHours(10, 25, 0, 0);

const codeTodayOnly = new Date(codeToday);
codeTodayOnly.setHours(0, 0, 0, 0);

const codeEvent = new Date();
codeEvent.setFullYear(2025, 11, 30); // 12月30日
codeEvent.setHours(18, 18, 0, 0);

const codeEventOnly = new Date(codeEvent);
codeEventOnly.setHours(0, 0, 0, 0);

const codeTimeDiff = codeEventOnly - codeTodayOnly;
const codeDayDiff = Math.ceil(codeTimeDiff / (1000 * 3600 * 24));

console.log('代码逻辑今天:', codeToday.toLocaleString('zh-CN'));
console.log('代码逻辑事件:', codeEvent.toLocaleString('zh-CN'));
console.log('代码逻辑天数差:', codeDayDiff, '天');

// 显示文本
let dayText;
if (codeDayDiff === 0) {
    dayText = '今天';
} else if (codeDayDiff === 1) {
    dayText = '明天';
} else if (codeDayDiff === 2) {
    dayText = '后天';
} else {
    dayText = `${codeDayDiff}天后`;
}

console.log('\n=== 最终显示结果 ===');
console.log('当前日期:', today.toLocaleDateString('zh-CN'));
console.log('事件日期:', cstEvent.toLocaleDateString('zh-CN'));
console.log('正确天数差:', 2, '天');
console.log('显示文本:', dayText);
console.log('是否正确:', dayText === '后天' ? '✅ 正确' : '❌ 不正确');
