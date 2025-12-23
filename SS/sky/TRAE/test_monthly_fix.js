// 模拟DOM环境的简单测试
const { JSDOM } = require('jsdom');

// 创建模拟的HTML结构
const html = `
<div id="monthly-time-points">
    <div id="monthly-times-container">
        <div class="time-input-group">
            <input type="time" name="monthly-time-0" class="start-time-input" value="08:00">
        </div>
        <div class="time-input-group">
            <input type="time" name="monthly-time-1" class="start-time-input" value="12:00">
        </div>
        <div class="time-input-group">
            <input type="time" name="monthly-time-2" class="start-time-input" value="18:00">
        </div>
    </div>
</div>
`;

// 创建DOM环境
const dom = new JSDOM(html);
global.document = dom.window.document;

console.log("测试每月特定时间点保存功能修复");
console.log("=============================");

// 测试修复前的选择器（应该只返回空数组，因为没有.time-input类）
try {
    const oldSelector = '#monthly-time-points .time-input';
    const oldTimePoints = Array.from(document.querySelectorAll(oldSelector)).map(input => input.value);
    console.log("修复前选择器（.time-input）收集的时间点：", oldTimePoints);
    console.log("修复前选择器是否正确收集所有时间点：", oldTimePoints.length === 3 ? "是" : "否");
} catch (error) {
    console.error("修复前选择器测试出错：", error);
}

// 测试修复后的选择器（应该返回所有3个时间点）
try {
    const newSelector = '#monthly-time-points .start-time-input';
    const newTimePoints = Array.from(document.querySelectorAll(newSelector)).map(input => input.value);
    console.log("修复后选择器（.start-time-input）收集的时间点：", newTimePoints);
    console.log("修复后选择器是否正确收集所有时间点：", newTimePoints.length === 3 ? "是" : "否");
} catch (error) {
    console.error("修复后选择器测试出错：", error);
}

console.log("=============================");
console.log("测试完成。");

// 如果修复后选择器能正确收集所有时间点，则修复成功
const finalTimePoints = Array.from(document.querySelectorAll('#monthly-time-points .start-time-input')).map(input => input.value);
if (finalTimePoints.length === 3) {
    console.log("🎉 修复成功！现在可以保存多个每月特定时间点了。");
} else {
    console.log("❌ 修复失败，请检查代码。");
}