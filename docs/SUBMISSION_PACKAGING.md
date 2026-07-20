# 提交包说明

`scripts/package-submission.ps1` 使用显式白名单生成一份完整运行交付包：

- 运行包：包含 `frontend/`、`backend/`、`miniprogram/`、`rag-knowledge/`，以及 `web/` 下的静态构建产物。

打包过程不会收录文档、Fay 运行时、Live2D SDK、MCP 服务、辅助服务项目、启动脚本、依赖目录、构建缓存、日志、数据库、开发工具目录、原始资料、历史原型或 Git 元数据。执行方式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-submission.ps1
```

交付文件默认生成在 `release/`，该目录不纳入版本控制。
