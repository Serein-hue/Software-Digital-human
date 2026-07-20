# 提交包说明

`scripts/package-submission.ps1` 使用显式白名单生成两类交付物：

- 源码包：仅包含 `frontend/`、`backend/`、`miniprogram/` 与 `rag-knowledge/`，以及项目说明和许可证。
- Web 部署包：包含 `docs/app/` 的静态构建产物，可直接部署到静态服务器。

打包过程不会收录 Fay 运行时、Live2D SDK、MCP 服务、辅助服务项目、启动脚本、依赖目录、构建缓存、日志、数据库、开发工具目录、原始资料、历史原型或 Git 元数据。执行方式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-submission.ps1
```

交付文件默认生成在 `release/`，该目录不纳入版本控制。
