# RAG 知识库服务 — 字段字典

> 版本：2.0.0 ｜ 更新：2026-06-03 ｜ 对应 OpenAPI：`contracts/openapi.yaml`
> 
> 本文档定义 RAG 服务所有数据结构的字段含义、类型约束、来源及业务用途，供 business/admin API 和数字人模块对接使用。

---

## 目录

1. [统一响应外壳 — ApiResponse](#1-统一响应外壳--apiresponse)
2. [分页外壳 — Pagination](#2-分页外壳--pagination)
3. [查询请求 — QueryRequest](#3-查询请求--queryrequest)
4. [查询响应 — QueryResponseData](#4-查询响应--queryresponsedata)
5. [上下文片段 — ContextItem](#5-上下文片段--contextitem)
6. [引用来源 — CitationItem](#6-引用来源--citationitem)
7. [兜底信息 — FallbackInfo](#7-兜底信息--fallbackinfo)
8. [文档元数据 — DocumentItem](#8-文档元数据--documentitem)
9. [入库任务 — IngestJob](#9-入库任务--ingestjob)
10. [入库请求与响应 — Ingest](#10-入库请求与响应--ingest)
11. [资料来源登记 — SourceRegister](#11-资料来源登记--sourceregister)
12. [采纳问答 — QARegister](#12-采纳问答--qaregister)
13. [知识库统计 — StatsResponseData](#13-知识库统计--statsresponsedata)
14. [健康检查 — HealthResponseData](#14-健康检查--healthresponsedata)
15. [错误码枚举](#15-错误码枚举)
16. [字段值域词典](#16-字段值域词典)
17. [完整 JSON 示例](#17-完整-json-示例)

---

## 1. 统一响应外壳 — ApiResponse

所有接口的响应**外层**统一用此结构包裹，不直接返回业务数据。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `code` | integer | 是 | `0` | 状态码。`0`=成功，正数=业务错误，负数=系统错误。完整枚举见[错误码枚举](#15-错误码枚举) |
| `message` | string | 是 | `"success"` | 提示语。成功时固定 `"success"`，失败时为具体错误描述（中文） |
| `data` | object / null | 是 | 见各接口 | 业务数据载体。成功时为对应 schema 的对象，失败时为 `null` |
| `trace_id` | string | 是 | `"trace_a1b2c3d4e5f6"` | 链路追踪 ID。入参 `X-Trace-Id` 请求头的值（透传），未传则服务端自动生成（`trace_` + 32位 hex） |

**来源**：`rag/api.py` → `_res()` 函数

---

## 2. 分页外壳 — Pagination

列表接口的数据内嵌此分页结构。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `page` | integer | 是 | `1` | 当前页码，从 1 开始。请求参数 `page`，默认 `1` |
| `page_size` | integer | 是 | `20` | 每页条数。请求参数 `page_size`，默认 `20`，最大 `100` |
| `total` | integer | 是 | `73` | 总条目数（非当前页条目数），由服务端统计 |
| `total_pages` | integer | 是 | `4` | 总页数。服务端计算：`ceil(total / page_size)` |

**分页数据容器格式**（data 字段内）：

```json
{
  "items": [ ... ],        // 当前页的具体条目列表
  "pagination": {          // Pagination 对象
    "page": 1,
    "page_size": 20,
    "total": 73,
    "total_pages": 4
  }
}
```

**来源**：`rag/api.py` → `_pagination()` / `_paginated_data()`

---

## 3. 查询请求 — QueryRequest

`POST /api/v1/rag/query` 请求体。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `query` | string | **是** | `"灵山大佛有多高？"` | 用户输入的自然语言问题。**不可为空**，前后空格会被 trim |
| `top_k` | integer | 否 | `5` | 返回最多几条相关片段。范围 `[1, 20]`，默认 `5`。超过 20 会被截断到 20 |
| `filters` | object | 否 | `{"domain": "spot_detail"}` | 精确过滤条件。详见下方说明 |

**filters 说明**：
- Key 为字段名（如 `domain`、`spot_id`、`freshness_level`），value 为精确值
- 支持 list 类型的 value（如 `{"domain": ["spot_detail", "guide"]}`），此时为 OR 语义
- 多个 key 之间为 AND 语义
- 暂不支持范围查询和模糊查询

**来源**：`rag/api.py` → `query()`，`rag_engine.py` → `query()`，`vector_store.py` → `ChromaStore.query()`

---

## 4. 查询响应 — QueryResponseData

`/query` 返回的 `data` 字段内容。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `trace_id` | string | 是 | `"trace_c8f9f03604a2"` | 同请求的 trace_id，用于链路追踪 |
| `answerable` | boolean | 是 | `true` | **核心标识**：`true`=找到高置信内容/可回答，`false`=未找到/分数不足/触发了兜底 |
| `contexts` | array[ContextItem] | 是 | `[...]` | 找到的原文片段列表。`answerable=true` 时有 ≥1 条；`false` 时为 `[]` |
| `citations` | array[CitationItem] | 是 | `[...]` | 引用来源列表。与 `contexts` 一一对应，便于展示"脚注式"引用。`answerable=false` 时为 `[]` |
| `fallback` | FallbackInfo / null | 是 | `null` | 兜底信息。`answerable=false` 时非 `null`，否则 `null` |
| `disclaimer` | string / null | 否 | `"以上信息来源于…"` | 时效性声明。当检索结果中**有 freshness_level="medium"** 的数据时返回，提示用户数据可能不是最新的 |
| `latency_ms` | number | 是 | `2.0` | 检索耗时，单位毫秒（ms）。从引擎收到请求到返回结果的整段时间 |

**来源**：`rag_engine.py` → `query()`，两处分支（answerable=true / false）

---

## 5. 上下文片段 — ContextItem

`query` 响应中 `contexts[]` 数组的每个元素，代表一条命中的原文片段。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `chunk_id` | string | 是 | `"chunk_b20b9987087152"` | 片段唯一 ID。由 `md5(source_file \| section \| seq \| text[:50])` 取前 14 位 hex 生成，`chunk_` 前缀。**相同内容在同一份文档中产生的 ID 稳定不变** |
| `text` | string | 是 | `"佛像高88m（主体高度79m+莲花瓣高度9m）"` | 片段**原文全文**（非摘要）。长度取决于入库时的 `chunk_size` 配置（默认 512 字符） |
| `score` | number | 是 | `0.666` | 语义相似度分数，范围 `[0, 1]`。越高越匹配。内部由 cosine 距离换算：`score = 1 - distance`。**阈值**：低于 `score_threshold`（配置项，默认 `0.5`）会被 fallback 拦截 |
| `source_name` | string | 是 | `"灵山胜境景点结构化数据集"` | 来源文档的可读名称。入库时由 `metadata.source_name` 传入 |
| `section` | string | 是 | `""` | 文档内章节/分节标识，用于定位。空串表示未分节 |
| `domain` | string | 是 | `"spot_detail"` | 领域分类标签。用于前端区分展示场景（景点详情/导览/票务…），也用于 `filters` 精确过滤 |
| `spot_id` | string | 是 | `"LS-011"` | 关联景点 ID。与前端景点数据 `siteData.ts` 中的 `id` 字段对应 |
| `authority_level` | string | 是 | `"official"` | 权威性等级，控制展示权重。详见[字段值域词典](#16-字段值域词典) |
| `freshness_level` | string | 是 | `"high"` | 数据时效性等级。影响 `disclaimer` 字段的生成。详见[字段值域词典](#16-字段值域词典) |
| `page` | integer / null | 否 | `null` | 原始文档页码（如有）。PDF/Word 来源时有值，Markdown 来源时为 `null` |

**来源**：`rag_engine.py` → `query()` 中 contexts 构建代码；底层数据来自 `Chunk.to_metadata()` + ChromaDB 检索结果

---

## 6. 引用来源 — CitationItem

`query` 响应中 `citations[]` 数组的每个元素，与 ContextItem **按相同下标一一对应**。用来展示"脚注式"引用信息。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `chunk_id` | string | 是 | `"chunk_32bdb9ee7ec382"` | 片段 ID，与对应 ContextItem 的 `chunk_id` 相同，用于关联 |
| `doc_id` | string | 是 | `"doc_lingshan_abc123"` | 所属文档 ID。由 `md5(source_file \| scenic_id \| domain)` 取前 12 位 hex 生成，`doc_` 前缀。**同一份文档 ID 稳定** |
| `source_name` | string | 是 | `"灵山胜境景点结构化数据集"` | 来源文档名称，同 ContextItem |
| `section` | string | 是 | `""` | 章节标识，同 ContextItem |
| `page` | integer / null | 否 | `null` | 页码，同 ContextItem |
| `quote` | string | 是 | `"佛像高88m（主体高度79m+莲花瓣高度9m）"` | 引用原文的**前 200 字符摘要**（非全文），适合 UI 做精简引用展示 |
| `score` | number | 是 | `0.6391` | 相似度分数，同 ContextItem |
| `domain` | string | 是 | `"spot_detail"` | 领域分类，同 ContextItem |
| `spot_id` | string | 是 | `"LS-011"` | 景点 ID，同 ContextItem |
| `authority_level` | string | 是 | `"official"` | 权威性等级，同 ContextItem |
| `freshness_level` | string | 是 | `"high"` | 时效性等级，同 ContextItem |

**来源**：`rag/citation.py` → `build_citations()`。数据从 ChromaDB 返回的 `metadata` 字典中提取。

---

## 7. 兜底信息 — FallbackInfo

当检索无法给出可靠回答时，填充此处。`answerable=false` 时必定返回。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `reason` | string | 是 | `"low_confidence"` | 无法回答的原因，用于前端/数字人决策逻辑。**4 种枚举值**见下方 |
| `safe_reply` | string | 是 | `"这个问题我不太确定，建议以景区官方信息为准。"` | 给用户的兜底回复文案。前端/数字人**可直接展示**此文本 |
| `top_score` | number | 是 | `0.4245` | 本次检索的最高匹配分数。业务方可用此判断"距离可回答还差多少" |

**reason 枚举值**：

| 值 | 触发条件 | 建议处理 |
|----|---------|---------|
| `no_relevant_docs` | 知识库为空，或检索返回 0 条结果 | 提示用户换种问法，或引导到 FAQ |
| `low_confidence` | 最高分 < score_threshold（默认 0.5） | 告诉用户"不太确定"，建议参考官方信息 |
| `sensitive_query` | 问题命中敏感词规则（手机号、身份证号、自定义敏感词库） | 拒绝回答，不透露具体触发词 |
| `realtime_data_unavailable` | 问题属于实时类 domain（如票价、演出时间、天气），但实时数据源不可用 | 引导用户查看景区官方小程序或公告 |

**来源**：`rag/fallback.py` → `classify_fallback()`

---

## 8. 文档元数据 — DocumentItem

代表一份已入库的文档。用于管理后台的知识库列表展示。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `id` | string | 是 | `"doc_lingshan_abc123"` | 文档唯一 ID。由 `md5(source_file \| scenic_id \| domain)` 取前 12 位 hex 生成，`doc_` 前缀 |
| `name` | string | 是 | `"灵山胜境景点结构化数据集"` | 文档的可读名称。对应入库时的 `metadata.source_name` |
| `source_file` | string | 是 | `"lingshan-dataset.md"` | 原始文件名（不含路径）。对应入库时的 `metadata.source_file` |
| `domain` | string | 是 | `"spot_detail"` | 领域分类标签 |
| `chunk_count` | integer | 是 | `48` | 该文档拆成的片段总数 |
| `created_at` | string (date-time) | 是 | `"2026-06-01T12:00:00Z"` | 文档首次入库时间，ISO 8601 格式 |
| `updated_at` | string (date-time) | 是 | `"2026-06-01T12:00:00Z"` | 文档最近更新入库时间，ISO 8601 格式 |

**注意**：当前版本暂未持久化存储 `created_at` 和 `updated_at`，这两个字段为扩展预留。ChromaDB 当前不记录时间戳。

---

## 9. 入库任务 — IngestJob

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `job_id` | string | 是 | `"ingest_91ea2ac817ac"` | 入库任务 ID。`ingest_` + `uuid4().hex[:12]`，**每次入库生成的 ID 唯一** |
| `filepath` | string | 是 | `"rag-knowledge/lingshan-dataset.md"` | 入库的源文件路径（请求时传入的原始路径） |
| `status` | string | 是 | `"completed"` | 任务状态。枚举：`pending`（排队中）、`running`（进行中）、`completed`（完成）、`failed`（失败） |
| `chunks_total` | integer | 是 | `48` | 本次入库生成的片段总数 |
| `created_at` | string (date-time) | 是 | `"2026-06-01T12:00:00Z"` | 任务创建时间，ISO 8601 |
| `elapsed_seconds` | number | 是 | `0.95` | 入库耗时（秒），含解析+清洗+分块+向量化+写入全流程 |

**注意**：当前 `/ingest` 接口为同步操作，成功后直接返回结果，不保留历史任务记录。`IngestJob` 结构主要为 H-03 管理接口预留。

---

## 10. 入库请求与响应 — Ingest

### 请求体 IngestRequest

`POST /api/v1/rag/ingest`

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `filepath` | string | **是** | `"rag-knowledge/lingshan-dataset.md"` | 要入库的文档路径。支持**绝对路径**或相对于**服务启动目录**的相对路径。**不支持 URL**，文件必须在服务端可访问 |
| `metadata` | object | 否 | `{}` | 文档元数据。见下方子字段 |
| `metadata.source_name` | string | 否 | `"灵山胜境景点结构化数据集"` | 文档可读名称，不传则默认取文件名 |
| `metadata.domain` | string | 否 | `"spot_detail"` | 领域分类。不传则为空串 |
| `metadata.scenic_id` | string | 否 | `"lingshan"` | 景区 ID。目前固定为 `"lingshan"`，多景区时扩展 |
| `metadata.spot_id` | string | 否 | `""` | 关联景点 ID |
| `metadata.section` | string | 否 | `""` | 文档内章节 |
| `metadata.authority_level` | string | 否 | `"official"` | 权威性等级。默认 `"official"`，可选 `high / medium / low` |
| `metadata.freshness_level` | string | 否 | `"high"` | 时效性等级。默认 `"high"`，可选 `medium / low` |
| `chunk_size` | integer | 否 | `512` | 分块大小（字符数）。默认 512，最小 64，最大 2048。建议 256~768 |
| `overlap` | integer | 否 | `64` | 相邻块重叠字符数。默认 64，建议为 `chunk_size` 的 10%~20%。太大影响去重，太小丢失上下文 |

### 响应体 IngestResponseData

`data` 字段内容：

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `job_id` | string | 是 | `"ingest_91ea2ac817ac"` | 本次入库的 job ID |
| `success` | boolean | 是 | `true` | 是否全部成功。`true`=分块+向量化+入库全部完成 |
| `message` | string | 是 | `"Ingest completed"` | 处理状态描述。失败时描述原因（如 "No chunks generated"） |
| `chars_raw` | integer | 是 | `51538` | 原始文档的字符数（含空白、 HTML/XML 标签等） |
| `chars_clean` | integer | 是 | `47935` | 清洗后的字符数（去重、去乱码、去噪声后的有效文本量） |
| `chunks` | integer | 是 | `48` | 生成的片段数。**注意**：可能为 0（文档过短或清洗后为空） |
| `inserted` | integer | 是 | `48` | 实际写入向量库的片段数。正常情况下等于 `chunks` |
| `elapsed_seconds` | number | 是 | `0.95` | 全流程耗时（秒）。包含解析→清洗→分块→向量化→入库 |
| `collection` | string | 是 | `"scenic_kb"` | 写入的 ChromaDB 集合名称，由配置 `vector_store_config.json` 定义 |

**来源**：`rag_engine.py` → `ingest_document()`

---

## 11. 资料来源登记 — SourceRegister

`POST /api/v1/rag/sources`（H-03 管理接口）

### 请求体 SourceRegisterRequest

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `name` | string | **是** | `"灵山胜境官方介绍手册"` | 资料名称。用于管理后台展示 |
| `filepath` | string | **是** | `"rag-knowledge/lingshan-guide.md"` | 文件路径。**注意**：这仅作登记，不触发实际入库。实际入库需另行调用 `/ingest` |
| `domain` | string | 否 | `"guide"` | 领域分类 |
| `description` | string | 否 | `"来自灵山景区官方发布的游览指南"` | 资料描述，管理后台展示用 |
| `tags` | array[string] | 否 | `["官方", "景点介绍"]` | 标签列表，便于后台检索筛选 |

### 响应体 data

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `source_id` | string | 是 | `"src_20260601_001"` | 资料登记 ID |
| `success` | boolean | 是 | `true` | 是否登记成功 |

**注意**：H-03 接口当前尚未实现。此文档仅定义协议格式。

---

## 12. 采纳问答 — QARegister

`POST /api/v1/rag/qa`（H-03 管理接口）

### 请求体 QARegisterRequest

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `question` | string | **是** | `"灵山大佛有多高？"` | 问句。被采纳的优质用户问题 |
| `answer` | string | **是** | `"灵山大佛通高88米（主体79米+莲花底座9米）"` | 答句。人工确认的正确回答 |
| `source` | string | 否 | `"lingshan-dataset.md"` | 答案来源文档，用于溯源 |
| `domain` | string | 否 | `"spot_detail"` | 领域分类 |

### 响应体 data

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `qa_id` | string | 是 | `"qa_20260601_001"` | 问答对 ID |
| `success` | boolean | 是 | `true` | 是否录入成功 |

**注意**：H-03 接口当前尚未实现。此文档仅定义协议格式。

---

## 13. 知识库统计 — StatsResponseData

`GET /api/v1/rag/stats` 返回的 `data` 字段。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `provider` | string | 是 | `"chroma"` | 向量数据库类型。当前固定为 `"chroma"`，后续可扩展支持 Milvus、FAISS 等 |
| `collection` | string | 是 | `"scenic_kb"` | 当前向量库集合名称，由配置决定 |
| `vectors` | integer | 是 | `73` | 向量库中**总片段数**。反映知识库规模，可用于监控数据是否正常接入 |
| `embedding_provider` | string | 是 | `"local"` | Embedding 模型运行方式：`local`（本地加载）、`chroma_default`（使用 ChromaDB 内置）、`cloud`（调用云端 API） |
| `embedding_model` | string | 是 | `"BAAI/bge-small-zh-v1.5"` | 当前使用的 Embedding 模型名称。注意：如果更换模型，**所有已入库向量需要重建索引**（因为不同模型输出的向量维度不同，不可混用） |
| `score_threshold` | number | 是 | `0.5` | 回答置信度阈值。分数低于此值的检索结果会被 fallback 拦截，不回传给用户 |
| `chunk_size` | integer | 是 | `512` | 默认分块大小（字符数） |
| `chunk_overlap` | integer | 是 | `64` | 默认分块重叠（字符数） |

**来源**：`rag_engine.py` → `stats()`，数据读取自 `rag_config.py` 配置属性

---

## 14. 健康检查 — HealthResponseData

`GET /api/v1/rag/health` 返回的 `data` 字段。

| 字段 | 类型 | 必填 | 示例 | 说明 |
|------|------|------|------|------|
| `status` | string | 是 | `"ok"` | 服务状态。正常时固定 `"ok"`，异常时服务不可达 |
| `timestamp` | number | 是 | `1780320796.089` | 当前服务器 Unix 时间戳（秒），用于时钟校验 |

**来源**：`rag/api.py` → `health()`

---

## 15. 错误码枚举

| code | 含义 | HTTP 状态码 | 触发场景 | 处理建议 |
|------|------|-------------|---------|---------|
| **0** | 成功 | 200 | 正常处理完成 | — |
| **10001** | 请求参数错误 | 400 | JSON 格式错误 / 缺少必填字段 / 参数校验不通过 | 调用方检查请求体格式和必填字段 |
| **10002** | 文件不存在 | 404 | `filepath` 指定的文件在服务端不存在 | 检查文件路径是否正确，文件是否已上传至服务端 |
| **40001** | 鉴权失败 | 401 | 缺少 `Authorization` 头 / Token 不匹配 / Token 格式错误 | 检查请求头是否携带 `Authorization: Bearer <token>`，token 值是否与 `RAG_API_KEY` 环境变量一致 |
| **40003** | 无权限 | 403 | Token 有效但无权访问特定资源 | （保留，当前未使用） |
| **50001** | 服务器内部错误 | 500 | 引擎异常 / 向量库异常 / 未知错误 | 查看服务端日志定位具体异常 |

**来源**：`openapi.yaml` → `x-error-codes`，`rag/api.py` 各路由中的 `_res(code=...)` 调用

---

## 16. 字段值域词典

### authority_level（权威性等级）

| 值 | 含义 | 适用场景 | 权重建议 |
|----|------|---------|---------|
| `official` | **官方权威** | 景区官方发布的一手资料、正式公告、官网内容 | 最高，应优先展示 |
| `high` | **高可信度** | 经过审核的第三方资料、权威媒体报道 | 较高 |
| `medium` | **中等可信度** | 一般性网络资料、百科内容 | 中等 |
| `low` | **低可信度** | 用户生成内容（UGC）、论坛讨论、未经核实的信息 | 最低，需谨慎引用 |

### freshness_level（数据时效性）

| 值 | 含义 | 典型来源 | 影响 |
|----|------|---------|------|
| `high` | **高时效**（长期有效） | 景点介绍、历史典故、建筑参数等稳定信息 | 无 disclaimer |
| `medium` | **中等时效**（可能变化） | 票价、演出时间表、开放时间等不定期更新的信息 | 触发 `disclaimer` 字段，提示用户以官方公告为准 |
| `low` | **低时效**（已过时） | 过期活动信息、历史公告等 | （保留，当前未使用） |

### domain（领域分类）

| 值 | 含义 | 典型问题 |
|-----|------|---------|
| `spot_detail` | 景点详情 | "灵山大佛有多高？""九龙灌浴几点开始？" |
| `guide` | 导览信息 | "景区路线怎么走？""有什么推荐的游览顺序？" |
| `ticket` | 票价信息 | "门票多少钱？""有没有学生票？" |
| `traffic` | 交通方式 | "怎么去灵山？""有没有停车场？" |
| `facility` | 设施服务 | "哪里有餐厅？""有寄存行李的地方吗？" |
| `history` | 历史背景 | "灵山胜境什么时候建的？""有哪些文化活动？" |
| `general` | 通用信息 | 未明确分类的通用问答 |

**注意**：`domain` 值区分为**静态 domain**（如 `spot_detail`、`guide`，内容相对固定 → answerable 时直接回答）和**实时 domain**（如 `ticket`、`traffic`，需要实时数据 → fallback 到 reatile_data_unavailable）。实时 domain 列表由配置 `fallback_config.json` → `实时类domain标记` 控制。

### fallback reason（无法回答原因）

详见 [FallbackInfo](#7-兜底信息--fallbackinfo) 章节。

### embeddings（Embedding 参数）

| 配置项 | 当前值 | 说明 |
|--------|--------|------|
| 模型提供商 | `BAAI/bge-small-zh-v1.5` | 针对中文优化的轻量 Embedding 模型，768 维 |
| 向量距离算法 | `cosine` | ChromaDB 配置 `hnsw:space: "cosine"` |
| 外部资源 | 通过镜像 `hf-mirror.com` 下载 | HuggingFace 直连被墙，启动时需设置 `HF_ENDPOINT=https://hf-mirror.com` |

### 请求头

| 请求头 | 必填 | 示例 | 说明 |
|--------|------|------|------|
| `X-Trace-Id` | 否 | `"my-custom-trace-001"` | 链路追踪 ID，调用方传入。会原样出现在响应 `trace_id` 中。不传则服务自动生成 |
| `Authorization` | **是**（除 `/health`） | `"Bearer <RAG_API_KEY>"` | Bearer Token 鉴权。Token 值由环境变量 `RAG_API_KEY` 配置，不应使用代码内默认密钥 |

---

## 17. 完整 JSON 示例

### 健康检查（成功）

```json
GET /api/v1/rag/health

{
  "code": 0,
  "message": "success",
  "data": {
    "status": "ok",
    "timestamp": 1780320796.089
  },
  "trace_id": "trace_550e8400e29b41d4"
}
```

### 查询（可回答）

```json
POST /api/v1/rag/query
Authorization: Bearer <RAG_API_KEY>
Content-Type: application/json

{
  "query": "灵山大佛有多高？",
  "top_k": 3
}

// 响应
{
  "code": 0,
  "message": "success",
  "data": {
    "trace_id": "trace_a1b2c3d4e5f6",
    "answerable": true,
    "contexts": [
      {
        "chunk_id": "chunk_b20b9987087152",
        "text": "灵山大佛通高88米（主体高度79米+莲花瓣高度9米），为青铜铸造。",
        "score": 0.666,
        "source_name": "灵山胜境景点结构化数据集",
        "section": "",
        "domain": "spot_detail",
        "spot_id": "LS-011",
        "authority_level": "official",
        "freshness_level": "high",
        "page": null
      }
    ],
    "citations": [
      {
        "chunk_id": "chunk_b20b9987087152",
        "doc_id": "doc_lingshan_abc123",
        "source_name": "灵山胜境景点结构化数据集",
        "section": "",
        "page": null,
        "quote": "灵山大佛通高88米（主体高度79米+莲花瓣高度9米），为青铜铸造。",
        "score": 0.666,
        "domain": "spot_detail",
        "spot_id": "LS-011",
        "authority_level": "official",
        "freshness_level": "high"
      }
    ],
    "fallback": null,
    "disclaimer": null,
    "latency_ms": 2.0
  },
  "trace_id": "trace_a1b2c3d4e5f6"
}
```

### 查询（不可回答 — 低分兜底）

```json
POST /api/v1/rag/query
Authorization: Bearer <RAG_API_KEY>
Content-Type: application/json

{
  "query": "今天天气怎么样？",
  "top_k": 5
}

// 响应
{
  "code": 0,
  "message": "success",
  "data": {
    "trace_id": "trace_xxx",
    "answerable": false,
    "contexts": [],
    "citations": [],
    "fallback": {
      "reason": "low_confidence",
      "safe_reply": "这个问题我不太确定，建议以景区官方信息为准。",
      "top_score": 0.3245
    },
    "latency_ms": 1.5
  },
  "trace_id": "trace_xxx"
}
```

### 入库（成功）

```json
POST /api/v1/rag/ingest
Authorization: Bearer <RAG_API_KEY>
Content-Type: application/json

{
  "filepath": "rag-knowledge/lingshan-dataset.md",
  "metadata": {
    "source_name": "灵山胜境景点结构化数据集",
    "domain": "spot_detail",
    "authority_level": "official",
    "freshness_level": "high"
  },
  "chunk_size": 512,
  "overlap": 64
}

// 响应
{
  "code": 0,
  "message": "success",
  "data": {
    "job_id": "ingest_91ea2ac817ac",
    "success": true,
    "message": "Ingest completed",
    "chars_raw": 51538,
    "chars_clean": 47935,
    "chunks": 48,
    "inserted": 48,
    "elapsed_seconds": 0.95,
    "collection": "scenic_kb"
  },
  "trace_id": "trace_xxx"
}
```

### 入库（文件不存在）

```json
// 响应
{
  "code": 10002,
  "message": "File not found: /not/exist.md",
  "data": null,
  "trace_id": "trace_xxx"
}
// HTTP 状态码: 404
```

### 鉴权失败

```json
GET /api/v1/rag/stats
// 未携带 Authorization 头

// 响应
{
  "code": 40001,
  "message": "Missing or invalid Authorization header",
  "data": null,
  "trace_id": "trace_xxx"
}
// HTTP 状态码: 401
```

---

## 附录：数据流图

```
                      ┌─────────────────────────────────────────────┐
                      │             调用方 (business/admin API)      │
                      │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
                      │  │ /query   │  │ /stats   │  │ /ingest  │  │
                      │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
                      └───────┼──────────────┼──────────────┼────────┘
                              │              │              │
                     X-Trace-Id + Authorization (除 /health)
                              │              │              │
                      ┌───────▼──────────────▼──────────────▼────────┐
                      │              RAG Flask Service (api.py)       │
                      │  ┌─ _res() 统一响应 ── _get_trace_id() ────┐  │
                      │  └──────┬────────────────────────────────────┘  │
                      └─────────┼───────────────────────────────────────┘
                                │
                      ┌─────────▼───────────────────────────────────────┐
                      │              RAG Engine (rag_engine.py)         │
                      │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
                      │  │ query()  │  │ ingest() │  │ stats()      │  │
                      │  │── fallback│  │── parse  │  └──────┬───────┘  │
                      │  │── contexts│  │── clean  │         │          │
                      │  │── citations│  │── chunk  │         │          │
                      │  └─────┬─────┘  │── embed  │         │          │
                      │        │        │── upsert │         │          │
                      │        │        └──────────┘         │          │
                      └────────┼─────────────────────────────┼──────────┘
                               │                             │
                      ┌────────▼─────────────────────────────▼──────────┐
                      │         ChromaDB (vector_store.py)               │
                      │  ┌─────────────────┐  ┌────────────────────┐    │
                      │  │ collection.query │  │ collection.count   │    │
                      │  ├─────────────────┤  ├────────────────────┤    │
                      │  │ 返回:            │  │ collection.upsert  │    │
                      │  │ ids + documents │  │ (chunks + embs)    │    │
                      │  │ metadatas + dist │  └────────────────────┘    │
                      │  └─────────────────┘                             │
                      └──────────────────────────────────────────────────┘
```

### 字段生成链路速查

| 输出字段 | 来源代码 | 原始数据位置 |
|----------|---------|-------------|
| `chunk_id` | `text_chunker.py` → `Chunk.chunk_id` | ChromaDB ids |
| `doc_id` | `text_chunker.py` → `Chunk.doc_id` | citation.py 中从 metadata 构建 |
| `text` / `quote` | `text_chunker.py` → `Chunk.text` | ChromaDB documents |
| `score` | `vector_store.py` → `1 - distance` | ChromaDB distances |
| `source_name` / `section` / `domain` / `spot_id` / `authority_level` / `freshness_level` / `page` | 入库时 `Chunk.to_metadata()` | ChromaDB metadatas |
| `source_file` / `scenic_id` / `chunk_seq` / `chunk_total` | `Chunk` 类属性 | ChromaDB metadatas（不在 ContextItem/CitationItem 中返回，但可在 DocumentItem 中使用） |
| `trace_id` | `api.py` → `_get_trace_id()` 或 `uuid4()` | 请求头或自动生成 |
| `latency_ms` | `rag_engine.py` → `time.time()` 差值 | 运行时计算 |
| `fallback.*` | `fallback.py` → `classify_fallback()` | 运行时计算 |
| `disclaimer` | `rag_config.py` → `get_phrase()` | `fallback_phrases.json` 配置 |
| `embeddings` | `embedding_service.py` → `encode()` | BGE 模型推理 |
