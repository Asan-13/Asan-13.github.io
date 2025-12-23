// 最终测试脚本，使用与index.html中相同的时区转换逻辑

// 模拟与index.html中相同的TimeZoneUtils对象实现
const TimeZoneUtils = {
    // 判断当前是否处于太平洋夏令时 - 固定返回false，使用标准时转换（+16小时）
    isPDT() {
        // 固定返回false，始终使用标准时转换（+16小时）
        // 这样用户设置的00:00（PDT）会始终转换为北京时间16:00
        return false;
    },
    
    // 太平洋时间到北京时间的转换
    PDTtoCST(pdtDate) {
        const offset = this.isPDT() ? 15 : 16; // 太平洋时间到北京时间：夏令时+15小时，标准时间+16小时
        return new Date(pdtDate.getTime() + offset * 60 * 60 * 1000);
    },
    
    // 北京时间到太平洋时间的转换
    CSTtoPDT(cstDate) {
        const offset = this.isPDT() ? 15 : 16;
        return new Date(cstDate.getTime() - offset * 60 * 60 * 1000);
    }
};

// 模拟convertToMilliseconds函数
function convertToMilliseconds(value, unit) {
    const conversions = {
        'minutes': 60 * 1000,
        'hours': 60 * 60 * 1000,
        'days': 24 * 60 * 60 * 1000
    };
    return value * (conversions[unit] || 1000);
}

// 模拟convertFromMilliseconds函数
function convertFromMilliseconds(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return { value: days, text: '天' };
    } else if (hours > 0) {
        return { value: hours, text: '小时' };
    } else if (minutes > 0) {
        return { value: minutes, text: '分钟' };
    } else {
        return { value: seconds, text: '秒' };
    }
}

// 模拟formatCountdown函数
function formatCountdown(milliseconds) {
    if (milliseconds <= 0) return '已开始';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}天${hours % 24}小时`;
    } else if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟${seconds % 60}秒`;
    } else {
        return `${seconds}秒`;
    }
}

// 修复后的getNextOccurrence函数（使用与index.html中相同的实现）
function getNextOccurrence(task, nowCST) {
    // 创建nowPDT变量表示当前太平洋时间
    const nowPDT = TimeZoneUtils.CSTtoPDT(nowCST);
    
    let startTimeStr = task.recurrence.startTime;
    let startHour = 10;
    let startMinute = 0;
    let startDateStr = "";
    
    // 处理startTime
    if (task.recurrence.startTimes && task.recurrence.startTimes.length > 0) {
        startTimeStr = task.recurrence.startTimes[0];
    } else if (task.recurrence.startTime) {
        startTimeStr = task.recurrence.startTime;
    } else {
        startTimeStr = "10:00";
    }
    
    // 解析startTime
    if (startTimeStr instanceof Date) {
        startHour = startTimeStr.getHours();
        startMinute = startTimeStr.getMinutes();
        startDateStr = startTimeStr.toISOString();
    } else if (typeof startTimeStr === "string") {
        if (startTimeStr.includes("-")) {
            // 旧格式，如"2023-05-17T10:00:00Z"
            const startDate = new Date(startTimeStr);
            startHour = startDate.getHours();
            startMinute = startDate.getMinutes();
            startDateStr = startTimeStr;
        } else {
            // 新格式，如"10:00"
            const timeParts = startTimeStr.split(":");
            startHour = parseInt(timeParts[0], 10);
            startMinute = parseInt(timeParts[1], 10);
            startDateStr = "";
        }
    }

    if (task.recurrence.type === "daily") {
        // 每天重复
        // 获取所有时间点，如果没有则使用当前的startHour和startMinute
        const timePoints = task.recurrence.startTimes && task.recurrence.startTimes.length > 0 ? 
            task.recurrence.startTimes.map(timeStr => {
                const [h, m] = timeStr.split(':').map(Number);
                return { hour: h, minute: m };
            }) : [{ hour: startHour, minute: startMinute }];
        
        // 计算今天和明天的所有时间点组合
        const today = new Date(nowPDT);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const candidates = [];
        
        // 检查今天的所有时间点
        for (const { hour, minute } of timePoints) {
            const testDatePDT = new Date(today);
            testDatePDT.setHours(hour, minute, 0, 0);
            if (testDatePDT > nowPDT) {
                candidates.push(testDatePDT);
            }
        }
        
        // 如果今天没有找到合适的时间点，检查明天的所有时间点
        if (candidates.length === 0) {
            for (const { hour, minute } of timePoints) {
                const testDatePDT = new Date(tomorrow);
                testDatePDT.setHours(hour, minute, 0, 0);
                candidates.push(testDatePDT);
            }
        }
        
        // 选择最近的时间点
        candidates.sort((a, b) => a - b);
        
        // 检查是否正在进行中（需要检查所有时间点，包括今天已经发生过的时间点）
        const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
        
        // 首先检查今天的所有时间点（包括已经发生过的），看是否有正在进行中的事件
        for (const { hour, minute } of timePoints) {
            const testDatePDT = new Date(today);
            testDatePDT.setHours(hour, minute, 0, 0);
            const candidateCST = TimeZoneUtils.PDTtoCST(testDatePDT);
            
            console.log(`\n检查时间点: ${hour}:${minute}`);
            console.log(`PDT时间: ${testDatePDT}`);
            console.log(`CST时间: ${candidateCST}`);
            console.log(`当前CST时间: ${nowCST}`);
            console.log(`结束时间: ${new Date(candidateCST.getTime() + durationMs)}`);
            
            if (candidateCST <= nowCST && nowCST < candidateCST.getTime() + durationMs) {
                console.log(`✅ 找到正在进行的事件！`);
                return {
                    startTime: candidateCST,
                    location: ""
                };
            }
        }
        
        // 如果没有正在进行中的事件，返回最近的时间点
        console.log(`\n❌ 没有找到正在进行的事件，返回最近的时间点: ${candidates[0]}`);
        const nextTimeCST = TimeZoneUtils.PDTtoCST(candidates[0]);
        return {
            startTime: nextTimeCST,
            location: ""
        };
    }

    return null;
}

// 模拟getTaskStatus函数的核心逻辑
function getTaskStatus(task, nowCST) {
    const durationMs = convertToMilliseconds(task.recurrence.duration, task.recurrence.durationUnit);
    const thresholdMs = convertToMilliseconds(24, 'hours'); // 显示开始时间阈值为24小时
    
    const nextOccurrence = getNextOccurrence(task, nowCST);
    if (!nextOccurrence || !nextOccurrence.startTime) {
        return { status: "future" };
    }
    
    const nextStartCST = nextOccurrence.startTime;
    const endTimeCST = new Date(nextStartCST.getTime() + durationMs);
    const displayStartTimeCST = new Date(nextStartCST.getTime() - thresholdMs);
    
    const isInDisplayRange = nowCST >= displayStartTimeCST;
    const isOngoing = nowCST >= nextStartCST && nowCST < endTimeCST;
    const timeUntilStart = nextStartCST - nowCST;
    
    let status;
    if (isOngoing) {
        status = "ongoing";
    } else if (isInDisplayRange) {
        status = "upcoming";
    } else {
        status = "future";
    }
    
    console.log(`\n=== 事件状态 ===`);
    console.log(`当前时间: ${nowCST}`);
    console.log(`开始时间: ${nextStartCST}`);
    console.log(`结束时间: ${endTimeCST}`);
    console.log(`显示开始时间: ${displayStartTimeCST}`);
    console.log(`状态: ${status}`);
    
    return {
        status: status,
        startTime: nextStartCST,
        endTime: endTimeCST
    };
}

// 测试不同的时间场景
function runTests() {
    // 创建测试任务：每天10:00、14:00、18:00重复，持续3小时
    const testTask = {
        recurrence: {
            type: "daily",
            startTimes: ["10:00", "14:00", "18:00"],
            duration: 3,
            durationUnit: "hours"
        }
    };
    
    console.log("=== 测试开始 ===");
    
    // 测试场景1：现在是CST时间08:00（上午8点）
    // 预期：最近的时间点是今天的10:00（PDT）-> CST第二天02:00，所以状态是future
    console.log("\n=== 测试场景1：CST时间08:00（上午8点） ===");
    const now1 = new Date(Date.UTC(2023, 11, 11, 0, 0, 0)); // UTC 00:00 -> CST 08:00
    getTaskStatus(testTask, now1);
    
    // 测试场景2：现在是CST时间12:00（中午12点）
    // 预期：最近的时间点是今天的14:00（PDT）-> CST第二天06:00，所以状态是future
    console.log("\n=== 测试场景2：CST时间12:00（中午12点） ===");
    const now2 = new Date(Date.UTC(2023, 11, 11, 4, 0, 0)); // UTC 04:00 -> CST 12:00
    getTaskStatus(testTask, now2);
    
    // 测试场景3：现在是CST时间14:00（下午2点）
    // 预期：最近的时间点是今天的18:00（PDT）-> CST第二天10:00，所以状态是future
    console.log("\n=== 测试场景3：CST时间14:00（下午2点） ===");
    const now3 = new Date(Date.UTC(2023, 11, 11, 6, 0, 0)); // UTC 06:00 -> CST 14:00
    getTaskStatus(testTask, now3);
    
    // 测试场景4：现在是CST时间20:00（晚上8点）
    // 预期：最近的时间点是今天的10:00（PDT）-> CST今天22:00，所以状态是upcoming
    console.log("\n=== 测试场景4：CST时间20:00（晚上8点） ===");
    const now4 = new Date(Date.UTC(2023, 11, 11, 12, 0, 0)); // UTC 12:00 -> CST 20:00
    getTaskStatus(testTask, now4);
    
    // 测试场景5：现在是CST时间23:00（晚上11点）
    // 预期：正在进行的时间点是今天的10:00（PDT）-> CST今天22:00，持续到今天25:00（第二天凌晨1点），所以状态是ongoing
    console.log("\n=== 测试场景5：CST时间23:00（晚上11点） ===");
    const now5 = new Date(Date.UTC(2023, 11, 11, 15, 0, 0)); // UTC 15:00 -> CST 23:00
    getTaskStatus(testTask, now5);
    
    // 测试场景6：现在是CST时间00:30（凌晨0:30）
    // 预期：正在进行的时间点是昨天的14:00（PDT）-> CST今天02:00，持续到今天05:00，所以状态是ongoing
    console.log("\n=== 测试场景6：CST时间00:30（凌晨0:30） ===");
    const now6 = new Date(Date.UTC(2023, 11, 12, 16, 30, 0)); // UTC 16:30 -> CST 00:30（第二天）
    getTaskStatus(testTask, now6);
    
    // 测试场景7：现在是CST时间06:30（早上6:30）
    // 预期：正在进行的时间点是昨天的18:00（PDT）-> CST今天10:00，持续到今天13:00，所以状态是ongoing
    console.log("\n=== 测试场景7：CST时间06:30（早上6:30） ===");
    const now7 = new Date(Date.UTC(2023, 11, 12, 22, 30, 0)); // UTC 22:30 -> CST 06:30（第二天）
    getTaskStatus(testTask, now7);
    
    console.log("\n=== 测试结束 ===");
}

// 运行测试
runTests();