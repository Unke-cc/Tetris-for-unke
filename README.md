# 俄罗斯方块unke - 液态玻璃版

一款采用现代液态玻璃视觉效果设计的俄罗斯方块游戏，为经典的俄罗斯方块游戏带来全新的视觉体验。

![游戏截图](https://via.placeholder.com/800x400/1a1a2e/ffffff?text=俄罗斯方块unke)

## ✨ 特色功能

- 🎨 **液态玻璃视觉效果** - 现代化的毛玻璃界面设计
- 🎮 **双游戏模式** - 经典模式和冲刺模式（40行）
- ⚙️ **可自定义设置** - DAS/ARR调节，按键绑定
- 👻 **幽灵方块预览** - 实时显示方块落点
- 🔊 **音效系统** - 沉浸式游戏音效
- 📱 **响应式设计** - 支持各种屏幕尺寸
- 💾 **本地存储** - 自动保存最高分和设置

## 🎯 游戏模式

### 经典模式
- 传统的俄罗斯方块玩法
- 随着等级提升，下落速度逐渐加快
- 消除行数越多，得分越高

### 冲刺模式
- 挑战在最短时间内消除40行
- 计时模式，追求速度极限
- 适合竞技和练习

## 🎮 操作说明

### 默认按键
- **移动**: `A`/`D` 或 `←`/`→`
- **旋转**: `←`/`→`/`↑` 箭头键
- **软降**: `S` 或 `↓`
- **硬降**: `W` 或 `空格`
- **暂存**: `↓` 箭头键
- **暂停**: `P`
- **退出**: 长按 `ESC`
- **重启**: 长按 `R`

### 高级功能
- **DAS (延迟自动移位)**: 控制按键响应延迟
- **ARR (自动重复速率)**: 控制连续移动速度
- **自定义按键绑定**: 在设置中重新配置所有按键

## 🚀 快速开始

### 在线体验
直接打开 `index.html` 文件即可开始游戏！

### 本地部署

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/tetris-unke.git
   cd tetris-unke
   ```

2. **启动游戏**
   - 方法一：直接双击 `index.html` 文件
   - 方法二：使用本地服务器
     ```bash
     # 使用Python
     python -m http.server 8000
     
     # 使用Node.js
     npx serve .
     
     # 使用Live Server (VS Code扩展)
     ```

3. **访问游戏**
   打开浏览器访问 `http://localhost:8000`

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **图形**: Canvas API
- **音频**: Web Audio API
- **存储**: LocalStorage
- **样式**: CSS Grid, Flexbox, CSS自定义属性
- **效果**: CSS backdrop-filter (毛玻璃效果)

## 📁 项目结构

```
tetris-unke/
├── index.html          # 主页面文件
├── script.js           # 游戏逻辑和交互
├── styles.css          # 样式和视觉效果
└── README.md           # 项目说明文档
```

## 🎨 设计特色

### 液态玻璃效果
- 使用 `backdrop-filter: blur()` 实现毛玻璃效果
- 渐变背景和光影效果
- 半透明界面元素
- 现代化的色彩搭配

### 响应式布局
- CSS Grid 实现灵活布局
- 移动端优化的界面适配
- 动态字体和间距调整

## ⚙️ 浏览器兼容性

- ✅ Chrome 76+
- ✅ Firefox 72+
- ✅ Safari 13+
- ✅ Edge 79+

**注意**: 需要支持 `backdrop-filter` 的现代浏览器以获得最佳视觉效果。

## 🔧 自定义配置

### 游戏设置
游戏支持以下自定义设置：

- **DAS (Delayed Auto Shift)**: 50-300ms
- **ARR (Auto Repeat Rate)**: 10-100ms
- **幽灵方块**: 开启/关闭
- **按键绑定**: 完全自定义

### 本地存储
游戏会自动保存：
- 最高分记录
- 个人设置偏好
- 按键绑定配置

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (2024)
- ✨ 初始版本发布
- 🎨 液态玻璃视觉效果
- 🎮 经典模式和冲刺模式
- ⚙️ 完整的设置系统
- 🔊 音效系统集成
- 📱 响应式设计

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👨‍💻 作者

**unke** - 游戏开发者

- 技术栈: HTML5 Canvas + JavaScript + CSS3
- 版本: 1.0

## 🙏 致谢

- 感谢经典俄罗斯方块游戏的启发
- 感谢现代Web技术的支持
- 感谢所有测试和反馈的朋友们

---

**享受游戏，挑战极限！** 🎮✨