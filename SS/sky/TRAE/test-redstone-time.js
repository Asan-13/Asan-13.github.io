// 模拟红黑石事件时间槽
const timeSlots = [
    { start: "18:28", end: "22:20" },
    { start: "00:28", end: "04:20" },
    { start: "06:28", end: "10:20" }
];

// 模拟当前北京时间（2025/12/28 09:00）
const now = new Date(2025, 11, 28, 9, 0, 0);
console.log('当前北京时间:', now.toLocaleString('zh-CN'));

// 模拟太平洋事件日期（2025/12/27）
const pacificEventDate = new Date(2025, 11, 27);

// 模拟PDTtoCST转换（简单模拟，实际应该使用时区转换）
function mockPDTtoCST(date) {
    // PDT (UTC-7) → CST (UTC+8) = +15小时
    return new Date(date.getTime() + 15 * 60 * 60 * 1000);
}

// 模拟TimeZoneUtils.isPDT
function mockIsPDT(date) {
    // 假设当前是PDT
    return true;
}

// 测试修复后的逻辑
const baseCSTDate = mockPDTtoCST(pacificEventDate);
baseCSTDate.setHours(0, 0, 0, 0);
console.log('基准北京时间:', baseCSTDate.toLocaleString('zh-CN'));

let targetTimeSlot = null;
let targetDay = null;

// 遍历所有时间槽，计算每个时间槽对应的北京时间完整日期和时间
for (let i = 0; i < timeSlots.length; i++) {
    const timeSlot = timeSlots[i];
    const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
    
    // 创建北京时间的时间槽开始时间
    const slotStartCST = new Date(baseCSTDate);
    slotStartCST.setHours(startHour, startMinute, 0, 0);
    
    // 计算时间槽结束时间
    const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
    const slotEndCST = new Date(baseCSTDate);
    slotEndCST.setHours(endHour, endMinute, 0, 0);
    
    // 处理跨天情况（如果结束时间早于开始时间，说明跨天了）
    if (slotEndCST < slotStartCST) {
        slotEndCST.setDate(slotEndCST.getDate() + 1);
    }
    
    console.log(`\n时间槽 ${i+1}:`);
    console.log(`开始时间: ${slotStartCST.toLocaleString('zh-CN')}`);
    console.log(`结束时间: ${slotEndCST.toLocaleString('zh-CN')}`);
    console.log(`当前时间在该时间槽内: ${now >= slotStartCST && now < slotEndCST}`);
    
    // 检查当前时间是否在这个时间槽内
    if (now >= slotStartCST && now < slotEndCST) {
        targetTimeSlot = timeSlot;
        targetDay = slotStartCST.getDate();
        console.log('✓ 找到匹配的时间槽');
        break;
    } 
    // 如果当前时间还没到第一个时间槽，显示第一个时间槽
    else if (i === 0 && now < slotStartCST) {
        targetTimeSlot = timeSlot;
        targetDay = slotStartCST.getDate();
        console.log('✓ 当前时间在第一个时间槽之前，使用第一个时间槽');
        break;
    }
    // 如果是最后一个时间槽，且当前时间已经过了开始时间但还没到结束时间
    else if (i === timeSlots.length - 1 && now >= slotStartCST) {
        targetTimeSlot = timeSlot;
        targetDay = slotStartCST.getDate();
        console.log('✓ 当前时间在最后一个时间槽内，使用最后一个时间槽');
        break;
    }
}

// 如果没有找到合适的时间槽，使用当前时间最接近的未来时间槽
if (!targetTimeSlot) {
    console.log('\n没有找到匹配的时间槽，查找未来时间槽');
    // 遍历所有时间槽，找到第一个未来的时间槽
    for (let i = 0; i < timeSlots.length; i++) {
        const timeSlot = timeSlots[i];
        const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
        const slotStartCST = new Date(baseCSTDate);
        slotStartCST.setHours(startHour, startMinute, 0, 0);
        
        // 如果是当天较晚的时间槽，可能需要跨天
        if (i > 0 && startHour < timeSlots[i-1].start.split(':')[0]) {
            slotStartCST.setDate(slotStartCST.getDate() + 1);
        }
        
        if (slotStartCST > now) {
            targetTimeSlot = timeSlot;
            targetDay = slotStartCST.getDate();
            console.log(`✓ 找到未来时间槽: ${slotStartCST.toLocaleString('zh-CN')}`);
            break;
        }
    }
    
    // 如果还是没有找到（可能所有时间槽都在今天之前），使用第一个时间槽
    if (!targetTimeSlot) {
        targetTimeSlot = timeSlots[0];
        const [startHour, startMinute] = targetTimeSlot.start.split(':').map(Number);
        const slotStartCST = new Date(baseCSTDate);
        slotStartCST.setHours(startHour, startMinute, 0, 0);
        // 如果是凌晨的时间槽，应该显示第二天
        if (startHour < 12) {
            slotStartCST.setDate(slotStartCST.getDate() + 1);
        }
        targetDay = slotStartCST.getDate();
        console.log(`✓ 所有时间槽都在今天之前，使用第一个时间槽: ${slotStartCST.toLocaleString('zh-CN')}`);
    }
}

console.log('\n=== 最终结果 ===');
console.log(`目标时间槽: ${targetTimeSlot.start} - ${targetTimeSlot.end}`);
console.log(`目标日期: ${targetDay}号`);
console.log(`显示文本: 红石: ${targetDay}号 ${targetTimeSlot.start} 云野-大树屋`);
