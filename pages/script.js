// 禁用开发者工具和右键菜单
document.onkeydown = function(e) {
    if (e.keyCode == 123) {  // F12
        e.preventDefault();
        alert("F12 被禁用！");
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {  
        e.preventDefault();
        alert("开发者工具被禁用！");
    }
    if (e.ctrlKey && e.keyCode == 85) {  
        e.preventDefault();
        alert("查看源代码被禁用！");
    }
};

document.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    alert("小伙子？想什么呢？代码是给你看的？");
});

// URL 状态更新函数
function updateUrlStatus(li, isAccessible, duration) {
    const statusBadge = li.querySelector('.status-badge');
    const msDisplay = li.querySelector('.ms-display');
    const timeValue = li.querySelector('.time-value');
    li.classList.remove('disabled');

    let statusClass;
    if (isAccessible) {
        statusBadge.innerHTML = '<i class="fas fa-check-circle"></i>👉点击访问';
        statusClass = 'status-normal';
        // 根据响应时间估算打开时间
        const estimatedTime = calculateEstimatedTime(duration);
        timeValue.textContent = estimatedTime;
    } else {
        li.classList.add('disabled');
        statusBadge.innerHTML = '<i class="fas fa-times-circle"></i>无法访问';
        statusClass = 'status-error';
        timeValue.textContent = '检测结果仅供参考，可以点击尝试访问。';
    }

    statusBadge.className = `status-badge ${statusClass}`;
    msDisplay.textContent = duration + 'ms';
    msDisplay.className = `ms-display ms-${statusClass.split('-')[1]}`;
}

// 计算预计打开时间
function calculateEstimatedTime(duration) {
    if (duration < 100) return '极快 (<1秒)';
    if (duration < 500) return '快速 (1-2秒)';
    if (duration < 1000) return '一般 (2-3秒)';
    if (duration < 2000) return '较慢 (3-5秒)';
    return '很慢 (>5秒)';
}

// 显示访问指南（简化版）
function showGuide(url) {
    const message = "1. 使用Chrome或自带浏览器\n2. 切换网络（4G/WIFI或开关代理）\n3. 如仍无法访问，请稍后重试";
    alert(message);
}

// URL 检查函数
function checkUrl(url, li) {
    return new Promise((resolve) => {
        const img = new Image();
        let isResolved = false;
        const startTime = performance.now();

        const timeoutId = setTimeout(() => {
            if (!isResolved) {
                updateUrlStatus(li, false, 5000);
                isResolved = true;
                resolve(false);
            }
        }, 5000); // 5秒超时

        img.onload = function() {
            if (!isResolved) {
                clearTimeout(timeoutId);
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                updateUrlStatus(li, true, duration);
                isResolved = true;
                resolve(true);
            }
        };

        img.onerror = function() {
            if (!isResolved) {
                clearTimeout(timeoutId);
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                updateUrlStatus(li, false, duration);
                isResolved = true;
                resolve(false);
            }
        };

        // 添加一个随机参数来避免缓存
        img.src = url + '/favicon.ico?' + new Date().getTime();
    });
}

// 检查所有 URL
async function checkAllUrls() {
    const urlList = document.getElementById('url-list');
    const listItems = Array.from(urlList.querySelectorAll('li'));
    let accessibleCount = 0;
    let inaccessibleCount = 0;
    
    // 移除加载状态相关代码
    
    const checkPromises = listItems.map(li => {
        const url = li.dataset.url;
        const statusBadge = li.querySelector('.status-badge');
        const msDisplay = li.querySelector('.ms-display');
        statusBadge.textContent = '检测中...';
        statusBadge.className = 'status-badge status-checking';
        msDisplay.className = 'ms-display ms-checking';
        msDisplay.textContent = '-ms';
        return checkUrl(url, li);
    });

    const results = await Promise.all(checkPromises);
    results.forEach(isAccessible => {
        if (isAccessible) {
            accessibleCount++;
        } else {
            inaccessibleCount++;
        }
    });
    
    // 移除加载状态相关代码
    
    // 优先显示可用线路
    // 修复排序逻辑：根据是否包含status-normal类来排序
    const sortedItems = [...listItems].sort((a, b) => {
        const aIsNormal = !a.classList.contains('disabled');
        const bIsNormal = !b.classList.contains('disabled');
        return bIsNormal - aIsNormal; // 可用的排在前面
    });
    
    // 清空列表并重新添加（按可用性排序）
    urlList.innerHTML = '';
    sortedItems.forEach(li => urlList.appendChild(li));

    updateLastCheckedTimeAndStats(accessibleCount, inaccessibleCount);
}

// 更新最后检查时间和统计信息
function updateLastCheckedTimeAndStats(accessibleCount, inaccessibleCount) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    document.getElementById('stats-container').innerHTML = `
        <div id="last-checked-time">
            <i class="fas fa-clock icon-clock"></i> 最后检测时间: ${timeString}
        </div>
        <div class="stats-row">
            <div class="stat-item">
                <div class="stat-value">
                    <i class="fas fa-check icon-check"></i>${accessibleCount}
                </div>
                <div class="stat-label">正常数量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">
                    <i class="fas fa-times icon-times"></i>${inaccessibleCount}
                </div>
                <div class="stat-label">无法访问数量</div>
            </div>
        </div>
    `;
}

// 暗黑模式相关变量和函数
const modeToggle = document.getElementById('mode-toggle');
const body = document.body;
const icon = modeToggle.querySelector('i');

function setDarkMode(isDark) {
    if (isDark) {
        body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        body.classList.remove('dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'disabled');
    }
}

function checkSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initializeDarkMode() {
    const userPreference = localStorage.getItem('darkMode');
    if (userPreference === 'enabled') {
        setDarkMode(true);
    } else if (userPreference === 'disabled') {
        setDarkMode(false);
    } else {
        setDarkMode(checkSystemPreference());
    }
}

// 初始化暗黑模式
initializeDarkMode();

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
    }
});

// 切换按钮点击事件
modeToggle.addEventListener('click', () => {
    setDarkMode(!body.classList.contains('dark-mode'));
});

// 收藏按钮功能
document.querySelector('.bookmark-btn').addEventListener('click', function(e) {
    e.preventDefault();
    
    const url = "https://www.44s4.com"; // 固定网址
    const title = "北极云地址发布页"; // 网站标题

    // 检查是否支持 Clipboard API
    if (navigator.clipboard) {
        // 使用 Clipboard API 复制到剪贴板
        navigator.clipboard.writeText(url).then(() => {
            // 将整个模块变成红色
            this.style.backgroundColor = 'red';
            this.style.color = 'white';
            this.textContent = '链接已复制，请黏贴在备忘录以免丢失';
            
            // 添加动画效果
            this.style.transform = 'scale(1.1)';
            this.style.transition = 'transform 0.3s ease';
            
            // 添加提示框
            const tooltip = document.createElement('div');
            tooltip.textContent = '已复制到剪贴板';
            tooltip.style.position = 'absolute';
            tooltip.style.top = '100%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '5px 10px';
            tooltip.style.borderRadius = '5px';
            tooltip.style.fontSize = '14px';
            tooltip.style.zIndex = '1000';
            this.appendChild(tooltip);
            
            // 3秒后恢复原来的样子
            setTimeout(() => {
                this.style.backgroundColor = '';
                this.style.color = '';
                this.innerHTML = '🚨 为防止失联迷路，点击收藏本站地址！🤪<br>https://www.44s4.com';
                this.style.transform = '';
                this.removeChild(tooltip);
            }, 3000);
        }).catch(err => {
            alert(`无法自动复制链接，请手动复制：${url}`);
        });
    } else {
        // 不支持 Clipboard API 的浏览器
        alert(`请手动复制链接或使用快捷键添加书签：${url}`);
    }
});

// 初始检查
checkAllUrls();

// 每20秒检查一次
setInterval(checkAllUrls, 20 * 1000);

document.querySelectorAll('#url-list > li').forEach(li => {
    li.addEventListener('click', function (e) {
        // 如果点击的是按钮或a标签等交互元素，则不跳转
        if (
            e.target.closest('a') ||
            e.target.closest('button') ||
            e.target.closest('.guide-btn') ||
            e.target.closest('.status-badge')
        ) {
            return;
        }
        const url = li.querySelector('a')?.href || li.getAttribute('data-url');
        if (url) {
            window.open(url, '_blank');
        }
    });

    // 只给"👉点击访问"标签加点击跳转
    li.addEventListener('click', function (e) {
        const badge = e.target.closest('.status-badge.status-normal');
        if (badge) {
            const url = li.querySelector('a')?.href || li.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
                e.stopPropagation(); // 防止冒泡到li的点击
            }
        }
    });
});