// 测试显示修复效果的脚本

// 模拟TimeZoneUtils对象（简化版本）
const TimeZoneUtils = {
    // 简化的时区转换（固定偏移+16小时）
    PDTtoCST: function(pdtDate) {
        const cstDate = new Date(pdtDate.getTime());
        cstDate.setHours(cstDate.getHours() + 16);
        return cstDate;
    },
    
    CSTtoPDT: function(cstDate) {
        const pdtDate = new Date(cstDate.getTime());
        pdtDate.setHours(pdtDate.getHours() - 16);
        return pdtDate;
    },
    
    // 格式化CST时间为HH:MM格式
    formatCSTTime: function(cstDate) {
        return cstDate.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
};

// 测试函数：模拟修复后的显示逻辑
function getRecurrenceText(task) {
    let recurrenceText = '';
    
    switch(task.recurrence.type) {
        case "daily":
            // 修复后的显示逻辑
            if (task.recurrence.dailyRepeatType === "time-range" && task.recurrence.rangeStart) {
                // 时间段模式：显示rangeStart作为开始时间
                const [startHour, startMinute] = task.recurrence.rangeStart.split(':').map(Number);
                const pdtDate = new Date();
                pdtDate.setHours(startHour, startMinute, 0, 0);
                const cstTime = TimeZoneUtils.formatCSTTime(TimeZoneUtils.PDTtoCST(pdtDate));
                recurrenceText = `每天 ${cstTime}`;
            } else if (task.recurrence.startTimes && task.recurrence.startTimes.length > 0) {
                // 时间点模式：显示所有时间点
                const cstTimes = task.recurrence.startTimes.map(timeStr => {
                    const [startHour, startMinute] = timeStr.split(':').map(Number);
                    const pdtDate = new Date();
                    pdtDate.setHours(startHour, startMinute, 0, 0);
                    return TimeZoneUtils.formatCSTTime(TimeZoneUtils.PDTtoCST(pdtDate));
                });
                recurrenceText = `每天 ${cstTimes.join(', ')}`;
            } else {
                recurrenceText = "每天";
            }
            break;
        default:
            recurrenceText = "未知重复类型";
    }
    
    return recurrenceText;
}

// 测试场景1：时间段模式的事件（应该显示07:01）
const testTask1 = {
    recurrence: {
        type: "daily",
        dailyRepeatType: "time-range",
        rangeStart: "07:01",
        rangeEnd: "23:03",
        intervalCount: "1",
        intervalUnit: "hour"
    }
};

// 测试场景2：时间点模式的事件（应该显示08:30）
const testTask2 = {
    recurrence: {
        type: "daily",
        dailyRepeatType: "time-points",
        startTimes: ["08:30"]
    }
};

// 测试场景3：没有startTimes的事件（应该显示"每天"）
const testTask3 = {
    recurrence: {
        type: "daily"
    }
};

// 运行测试
console.log("测试场景1（时间段模式）:", getRecurrenceText(testTask1));
console.log("测试场景2（时间点模式）:", getRecurrenceText(testTask2));
console.log("测试场景3（无时间设置）:", getRecurrenceText(testTask3));

// 验证修复效果
const expectedResult1 = "每天 23:01"; // 07:01 PDT + 16小时 = 23:01 CST
const actualResult1 = getRecurrenceText(testTask1);

if (actualResult1.includes("23:01")) {
    console.log("修复成功：时间段模式的事件显示了正确的开始时间");
} else {
    console.log("修复失败：时间段模式的事件没有显示正确的开始时间");
}
