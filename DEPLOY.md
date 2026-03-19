# 部署到Vercel指南

本指南将帮助您将农药库存管理系统部署到Vercel，获得免费的HTTPS支持，解决摄像头权限问题。

## 步骤1：准备项目

1. **确保项目结构完整**：
   - package.json
   - server.js
   - db.js
   - views/ 目录
   - .gitignore 文件

2. **修改package.json**：确保包含正确的启动脚本
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

## 步骤2：注册Vercel账号

1. 访问 https://vercel.com/
2. 使用GitHub、GitLab或Bitbucket账号注册
3. 完成邮箱验证

## 步骤3：部署项目

### 方法A：通过Vercel官网部署

1. **登录Vercel**：进入Vercel控制台
2. **导入项目**：
   - 点击 "New Project"
   - 选择 "Import Project"
   - 选择 "From Git Repository"

3. **连接GitHub**：
   - 点击 "Connect to GitHub"
   - 授权Vercel访问您的GitHub账号
   - 选择您的项目仓库

4. **配置部署**：
   - 项目名称：可自定义
   - 框架预设：选择 "Other"
   - 根目录：保持默认
   - 构建命令：保持默认（留空）
   - 输出目录：保持默认（留空）
   - 环境变量：暂时不需要

5. **部署**：点击 "Deploy" 按钮

6. **获取HTTPS地址**：部署完成后，Vercel会生成一个HTTPS地址，如 `https://your-project.vercel.app`

### 方法B：手动部署（无需GitHub）

1. **下载项目文件**：将项目文件夹压缩为ZIP文件
2. **登录Vercel**：进入Vercel控制台
3. **导入项目**：
   - 点击 "New Project"
   - 选择 "Import Project"
   - 选择 "Drag and Drop"
4. **上传ZIP文件**：将项目ZIP文件拖放到指定区域
5. **配置部署**：同方法A
6. **部署**：点击 "Deploy" 按钮

## 步骤4：测试部署

1. **访问系统**：在浏览器中输入Vercel生成的HTTPS地址
2. **测试扫码功能**：
   - 进入入库或出库页面
   - 点击 "手机扫码" 按钮
   - 浏览器会弹出摄像头权限请求，点击 "允许"
   - 对准条码进行扫描

## 步骤5：数据库配置（可选）

### 使用Supabase数据库（推荐）

1. **注册Supabase账号**：https://supabase.com/
2. **创建项目**：
   - 点击 "New Project"
   - 填写项目名称
   - 设置数据库密码
   - 选择区域
   - 点击 "Create Project"

3. **获取连接信息**：
   - 进入项目设置
   - 点击 "Database"
   - 复制 "Connection String"

4. **修改db.js**：
   ```javascript
   // 替换为Supabase连接信息
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient('https://your-project.supabase.co', 'your-anon-key');
   ```

5. **重新部署**：将修改后的代码重新部署到Vercel

## 常见问题

### 1. 摄像头权限问题
- **解决方案**：使用HTTPS地址访问，浏览器会正常弹出权限请求

### 2. 数据库连接问题
- **解决方案**：确保Supabase连接信息正确，并且数据库表结构已创建

### 3. 部署失败
- **解决方案**：检查package.json中的依赖是否正确，确保启动脚本无误

## 技术支持

如果遇到部署问题，可以参考Vercel官方文档：https://vercel.com/docs

或者联系Vercel支持：https://vercel.com/support