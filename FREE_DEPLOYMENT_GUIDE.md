# K-12 AI学习平台 - 完全免费部署方案

## 概览

你可以**完全免费**部署这个平台，零成本！本指南提供了最佳免费方案组合。

```
前端 (React)    → Vercel 或 Netlify (完全免费)
后端 (Flask)    → Railway 或 Render (免费Tier)
数据库          → PostgreSQL (免费Tier)
域名            → Freenom.com (免费.tk/.ml域名)
邮件            → Gmail (免费)
```

---

## 💎 完整免费组合方案

### 方案A: 最推荐（我的首选）

| 组件 | 服务 | 免费额度 | 说明 |
|------|------|--------|------|
| **前端** | Vercel | 无限 | 无限部署、无限带宽、自动HTTPS |
| **后端** | Railway | $5/月额度 | 足够运行Flask应用 |
| **数据库** | Railway PostgreSQL | $5/月额度 | 包含在Railway额度内 |
| **域名** | Freenom | 完全免费 | .tk, .ml, .ga, .cf 免费注册 |
| **总成本** | **$0/月** | ✅ | 有5美元免费额度 |

### 方案B: 也很不错

| 组件 | 服务 | 免费额度 | 说明 |
|------|------|--------|------|
| **前端** | Netlify | 无限 | 无限部署、CI/CD免费 |
| **后端** | Render | 15天活跃免费 | 免费实例会休眠 |
| **数据库** | Render PostgreSQL | 90天免费 | PostgreSQL免费试用 |
| **域名** | Freenom | 完全免费 | .tk, .ml, .ga, .cf 免费 |
| **总成本** | **$0/月** | ✓ | 有限制但完全免费 |

---

## 第一步：部署前端 (Vercel) - 10分钟

### 1. 创建Vercel账户

```
访问: https://vercel.com
点击 "Sign Up" → 选择 "GitHub" 登录
（如果没有GitHub，先创建）
```

### 2. 连接GitHub仓库

```bash
# 1. 在GitHub创建新仓库
# 仓库名: learning-platform

# 2. 推送代码到GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/learning-platform.git
git push -u origin main
```

### 3. 在Vercel部署

```
1. 在Vercel仪表板点击 "Add New..." → "Project"
2. 选择你的 learning-platform 仓库
3. 框架预设选择 "Create React App"
4. 点击 "Deploy"
5. 等待部署完成（1-2分钟）
```

**结果**: 你的前端应用现在可以在以下地址访问：
```
https://learning-platform-YOUR_USERNAME.vercel.app
```

---

## 第二步：部署后端 (Railway) - 15分钟

### 1. 创建Railway账户

```
访问: https://railway.app
点击 "Sign Up" → 选择 "GitHub" 登录
```

### 2. 创建新项目

```
1. 点击 "Create New Project"
2. 选择 "Deploy from GitHub repo"
3. 授权Railway访问你的GitHub
4. 创建新仓库或使用现有仓库
```

### 3. 添加PostgreSQL数据库

```
1. 在Railway仪表板点击 "Add"
2. 搜索 "PostgreSQL"
3. 点击 "Provision" 添加PostgreSQL数据库
4. 自动生成的DATABASE_URL将显示在Variables中
```

### 4. 部署Flask应用

**创建 Procfile** (在项目根目录):
```
web: python app.py
```

**创建 requirements.txt**:
```
anthropic==0.7.8
flask==2.3.0
flask-cors==4.0.0
python-dotenv==1.0.0
psycopg2-binary==2.9.0
gunicorn==21.0.0
```

**修改 app.py** 最后部分:
```python
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

### 5. 推送到GitHub

```bash
git add .
git commit -m "Add Railway deployment files"
git push origin main
```

### 6. Railway自动部署

```
Railway会自动检测到推送并开始部署
在仪表板中监控部署进度
```

**结果**: 你的后端API现在可以访问：
```
https://your-project.up.railway.app
```

---

## 第三步：申请免费域名 - 5分钟

### 方案1: Freenom (最简单)

**步骤1: 访问Freenom**
```
https://www.freenom.com
```

**步骤2: 搜索域名**
```
1. 在搜索框输入你想要的域名（如 "mylearningplatform"）
2. 点击 "Check Availability"
3. 选择免费的顶级域名 (.tk, .ml, .ga, .cf)
4. 点击 "Get it now"
```

**步骤3: 注册账户**
```
1. 创建Freenom账户
2. 输入个人信息
3. 选择"注册期限" → 12个月免费 (必须选择！)
4. 完成注册
```

**步骤4: 配置DNS**
```
1. 在Freenom管理面板找到 "Manage Domains"
2. 选择你的域名 → "Manage Domain"
3. 点击 "Manage Freenom DNS"
4. 添加A记录指向你的Vercel/Netlify IP
```

### 方案2: Namecheap (更可靠)

```
https://www.namecheap.com/domains/

1. 搜索 ".tk" 或 ".ml" 域名
2. 选择免费的顶级域名
3. 使用免费注册代码: YOURFIRSTDOMAIN (通常有)
4. 配置DNS指向你的应用
```

---

## 第四步：连接域名到应用 - 10分钟

### 连接到Vercel (前端)

**在Vercel中：**
```
1. 打开项目设置 → Domains
2. 输入你的域名 (如 myplatform.tk)
3. 点击 "Add"
4. Vercel会给你DNS配置说明
```

**在Freenom DNS中：**
```
按照Vercel提供的说明添加DNS记录：
- A记录: 76.76.19.125 (Vercel的IP)
或
- CNAME: cname.vercel-dns.com
```

### 连接到Railway (后端)

**在Railway中：**
```
1. 项目设置 → Environment
2. 添加自定义域名
3. 获取DNS配置
```

**配置子域名：**
```
如果主域名指向前端，后端可以用子域名：
- 前端: myplatform.tk
- 后端: api.myplatform.tk
```

---

## 环境变量配置

### Railway环境变量设置

在Railway仪表板中，添加这些变量：

```
ANTHROPIC_API_KEY=sk-your-api-key-here
DATABASE_URL=postgres://... (自动生成)
FLASK_ENV=production
```

### Vercel环境变量设置

在Vercel项目设置中：

```
REACT_APP_API_URL=https://api.myplatform.tk
REACT_APP_DOMAIN=myplatform.tk
```

---

## 完整的配置示例

### Flask应用修改 (app.py)

```python
from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# 允许来自你的前端域名的请求
allowed_origins = [
    "https://myplatform.tk",
    "https://learning-platform-username.vercel.app",
    "http://localhost:3000"
]

CORS(app, origins=allowed_origins)

# 从环境变量获取API密钥
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'api': 'v1',
        'domain': os.getenv('DOMAIN', 'localhost')
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
```

### React应用修改 (src/App.jsx)

```jsx
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// 使用API
fetch(`${API_URL}/api/health`)
  .then(res => res.json())
  .then(data => console.log('API响应:', data))
  .catch(err => console.error('API错误:', err));
```

---

## DNS配置详解

### Vercel DNS设置（对于Freenom）

在Freenom管理面板中添加：

```
Type    Name           Value
─────────────────────────────────────────
A       @              76.76.19.125
CNAME   www            cname.vercel-dns.com
```

或者使用Vercel提供的NS记录（更推荐）：

```
NS      @              ns1.vercel-dns.com
NS      @              ns2.vercel-dns.com
NS      @              ns3.vercel-dns.com
NS      @              ns4.vercel-dns.com
```

### Railway DNS设置（对于子域名api）

```
Type    Name           Value
─────────────────────────────────────────
CNAME   api            railway.app
```

---

## 完整的部署步骤总结

### ✅ 清单

```
第1步: GitHub
- [ ] 创建GitHub账户
- [ ] 创建仓库: learning-platform
- [ ] 推送代码

第2步: 前端 (Vercel)
- [ ] 创建Vercel账户
- [ ] 连接GitHub仓库
- [ ] 部署前端应用
- [ ] 获取临时URL: *.vercel.app

第3步: 后端 (Railway)
- [ ] 创建Railway账户
- [ ] 创建项目并添加PostgreSQL
- [ ] 添加Procfile和requirements.txt
- [ ] 推送到GitHub并自动部署
- [ ] 获取Railway URL

第4步: 域名 (Freenom)
- [ ] 访问freenom.com
- [ ] 注册免费域名 (.tk/.ml)
- [ ] 记录域名名称

第5步: DNS配置
- [ ] 在Freenom配置DNS
- [ ] 在Vercel添加域名
- [ ] 在Railway配置子域名
- [ ] 等待DNS传播 (5分钟 - 48小时)

第6步: 测试
- [ ] 访问 myplatform.tk
- [ ] 测试前端应用
- [ ] 测试API连接
```

---

## 常见问题

### Q: 为什么DNS没有立即生效？

**A**: DNS传播需要时间：
- 第一次通常需要 5-30分钟
- 某些DNS可能需要 24-48小时
- 可以在 https://dnschecker.org 检查状态

### Q: Railway的$5免费额度什么时候用完？

**A**: 
- 新账户获得 $5/月 的免费额度
- 足够运行一个Flask应用 + 一个PostgreSQL数据库
- 如果超出，会自动暂停（不会收费）
- 需要时可以升级付费方案

### Q: 可以用真实域名吗（如.com）？

**A**: 是的！但需要付费：
- Namecheap: .com 约 $8.88/年
- GoDaddy: .com 约 $7.99/年
- Freenom: .tk/.ml 完全免费

### Q: 我的API在Railway运行，但前端连接不了？

**A**: 检查这些：
1. CORS配置是否正确？
2. API_URL环境变量是否设置？
3. Railway项目是否正确部署？
4. 检查Railway日志查看错误

### Q: 数据库会丢失吗？

**A**: Railway PostgreSQL：
- 免费Tier数据保存
- 有自动备份
- 不需要担心数据丢失

### Q: 可以用多个子域名吗？

**A**: 可以！例如：
```
myplatform.tk          → 前端
api.myplatform.tk      → 后端 (Flask)
admin.myplatform.tk    → 管理面板
```

只需在DNS中添加多个CNAME记录。

---

## 完全免费的月度成本分解

```
2024年部署成本
═══════════════════════════════════
前端 (Vercel)           $0 (无限)
后端 (Railway)          $0 ($5免费额度)
数据库 (Railway PG)     $0 (包含)
域名 (Freenom)          $0 (永久免费)
邮件 (Gmail)            $0 (免费)
─────────────────────────────────
总计                     $0/月 ✅
═══════════════════════════════════

额外支出（可选）:
CDN加速                $0 (Vercel内置)
SSL/HTTPS              $0 (自动)
API监控                $0 (Railway内置)
```

---

## 下一步：从免费升级到付费（可选）

如果应用增长，可以升级到：

```
前端: Vercel Pro ($20/月)
后端: Railway Hobby ($5/月) → Railway Standard ($20/月)
域名: 购买.com域名 ($8-15/年)
数据库: Railway managed ($15+/月)
CDN: Cloudflare Enterprise (按需)

但现在，你可以完全免费运行！
```

---

## 部署检查清单

在部署前，确保：

```
代码质量
- [ ] 所有依赖都在 requirements.txt 中
- [ ] 没有硬编码的API密钥
- [ ] 环境变量正确设置
- [ ] CORS配置正确

前端
- [ ] React应用可以本地运行
- [ ] API_URL正确配置
- [ ] build文件夹可以生成

后端
- [ ] Flask应用可以本地运行
- [ ] 所有路由都工作正常
- [ ] 数据库连接字符串正确
- [ ] Procfile存在且正确

数据库
- [ ] PostgreSQL可以连接
- [ ] 数据表已创建
- [ ] 备份策略已规划

域名
- [ ] 域名已注册
- [ ] DNS记录已添加
- [ ] DNS已传播
```

---

## 快速参考

### Vercel部署命令
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Railway部署命令
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

### Git推送（自动触发部署）
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

---

## 获取帮助

- **Vercel文档**: https://vercel.com/docs
- **Railway文档**: https://docs.railway.app
- **Freenom帮助**: https://www.freenom.com/?lang=en
- **DNS调试**: https://dnschecker.org

---

## 总结

你现在有了：
✅ 完全免费的前端托管 (Vercel)
✅ 完全免费的后端托管 (Railway + PostgreSQL)
✅ 完全免费的域名 (Freenom)
✅ 总成本: $0/月

**现在就部署吧！** 🚀

部署完成后，你可以与任何人分享：
```
https://myplatform.tk
```

没有任何费用！
