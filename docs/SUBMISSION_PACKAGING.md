# 提交包说明

`scripts/package-submission.ps1` 使用显式白名单生成两类交付物：

- 源码包：包含前后端、小程序、知识库、唯一的原始资料副本、Fay 运行时、Live2D 资源及启动脚本。
- Web 部署包：包含 `docs/app/` 的静态构建产物，可直接部署到静态服务器。

打包过程不会收录依赖目录、构建缓存、日志、数据库、开发工具目录、原始资料副本、Fay 课程知识包、历史原型或 Git 元数据。执行方式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-submission.ps1
```

交付文件默认生成在 `release/`，该目录不纳入版本控制。
