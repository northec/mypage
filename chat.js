/**
 * AI 对话助手
 * 功能：多轮对话、历史记录、localStorage 缓存
 */

(function() {
    'use strict';

    // DOM 元素
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatClear = document.getElementById('chatClear');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatBadge = document.getElementById('chatBadge');

    // 状态
    let isOpen = false;
    let messages = [];
    let isTyping = false;

    // 初始化
    function init() {
        loadMessages();
        bindEvents();
        renderMessages();
        updateBadge();
    }

    // 绑定事件
    function bindEvents() {
        chatToggle.addEventListener('click', toggleChat);
        chatClose.addEventListener('click', closeChat);
        chatClear.addEventListener('click', clearMessages);
        chatSend.addEventListener('click', sendMessage);

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // 自动调整输入框高度
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (isOpen && !chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
                closeChat();
            }
        });
    }

    // 加载历史消息
    function loadMessages() {
        const stored = localStorage.getItem('chatMessages');
        if (stored) {
            const data = JSON.parse(stored);
            // 检查是否过期
            if (Date.now() - data.timestamp < AI_CONFIG.cacheExpiry) {
                messages = data.messages;
            } else {
                localStorage.removeItem('chatMessages');
            }
        }
    }

    // 保存消息
    function saveMessages() {
        localStorage.setItem('chatMessages', JSON.stringify({
            messages: messages,
            timestamp: Date.now()
        }));
    }

    // 切换对话窗口
    function toggleChat() {
        isOpen ? closeChat() : openChat();
    }

    // 打开对话窗口
    function openChat() {
        isOpen = true;
        chatWindow.classList.add('open');
        chatBadge.classList.remove('show');

        // 如果没有历史消息，显示欢迎语
        if (messages.length === 0) {
            addMessage('assistant', AI_CONFIG.welcomeMessage);
        }

        scrollToBottom();
    }

    // 关闭对话窗口
    function closeChat() {
        isOpen = false;
        chatWindow.classList.remove('open');
    }

    // 清空消息
    function clearMessages() {
        if (confirm('确定要清空对话历史吗？')) {
            messages = [];
            localStorage.removeItem('chatMessages');
            renderMessages();
            addMessage('assistant', AI_CONFIG.welcomeMessage);
        }
    }

    // 添加消息
    function addMessage(role, content) {
        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };

        messages.push(message);

        // 限制消息数量
        if (messages.length > AI_CONFIG.maxMessages) {
            messages = messages.slice(-AI_CONFIG.maxMessages);
        }

        saveMessages();
        renderMessage(message);
        scrollToBottom();
    }

    // 渲染所有消息
    function renderMessages() {
        chatMessages.innerHTML = '';
        messages.forEach(renderMessage);
    }

    // 渲染单条消息
    function renderMessage(message) {
        const div = document.createElement('div');
        div.className = `chat-message ${message.role}`;

        // 头像
        const avatar = document.createElement('div');
        avatar.className = 'chat-message-avatar';
        if (message.role === 'user') {
            avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>`;
        } else {
            avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7H9V5.73C8.4 5.39 8 4.74 8 4a2 2 0 0 1 2-2z"/>
            </svg>`;
        }

        // 内容
        const content = document.createElement('div');
        content.className = 'chat-message-content';
        content.innerHTML = formatMessage(message.content);

        // 时间
        const time = document.createElement('div');
        time.className = 'chat-message-time';
        const date = new Date(message.timestamp);
        time.textContent = formatTime(date);

        const contentWrapper = document.createElement('div');
        contentWrapper.appendChild(content);
        contentWrapper.appendChild(time);

        div.appendChild(avatar);
        div.appendChild(contentWrapper);

        chatMessages.appendChild(div);
    }

    // 格式化消息内容
    function formatMessage(content) {
        // 简单的 Markdown 格式化
        let formatted = content
            // 代码块
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 加粗
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // 列表
            .replace(/^\d+\.\s+(.+)$/gm, '<ol><li>$1</li></ol>')
            .replace(/^[-•]\s+(.+)$/gm, '<ul><li>$1</li></ul>')
            // 换行
            .replace(/\n/g, '<br>');

        // 修复列表标签
        formatted = formatted.replace(/<\/ol><br><ol>/g, '').replace(/<\/ul><br><ul>/g, '');

        return formatted;
    }

    // 格式化时间
    function formatTime(date) {
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }

    // 显示加载动画
    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-message assistant';
        div.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'chat-message-avatar';
        avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7H9V5.73C8.4 5.39 8 4.74 8 4a2 2 0 0 1 2-2z"/>
        </svg>`;

        const content = document.createElement('div');
        content.className = 'chat-message-content';
        content.innerHTML = '<div class="chat-typing"><span></span><span></span><span></span></div>';

        div.appendChild(avatar);
        div.appendChild(content);
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    // 隐藏加载动画
    function hideTyping() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    // 滚动到底部
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 更新未读徽章
    function updateBadge() {
        if (!isOpen && messages.length > 1) {
            // 只计算新消息（排除欢迎语）
            const unreadCount = Math.max(0, messages.length - 1);
            if (unreadCount > 0) {
                chatBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                chatBadge.classList.add('show');
            }
        }
    }

    // 发送消息
    async function sendMessage() {
        const content = chatInput.value.trim();
        if (!content || isTyping) return;

        // 添加用户消息
        addMessage('user', content);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // 显示加载动画
        isTyping = true;
        showTyping();

        try {
            // 调用 API
            const response = await fetch(AI_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`
                },
                body: JSON.stringify({
                    model: AI_CONFIG.model,
                    messages: [
                        { role: 'system', content: AI_CONFIG.systemPrompt },
                        ...messages.map(m => ({ role: m.role, content: m.content }))
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            const data = await response.json();
            const aiMessage = data.choices[0].message.content;

            hideTyping();
            addMessage('assistant', aiMessage);

        } catch (error) {
            console.error('API Error:', error);
            hideTyping();
            addMessage('assistant', '抱歉，我遇到了一些问题。请稍后再试，或直接联系包子老师。');
        } finally {
            isTyping = false;
        }
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
