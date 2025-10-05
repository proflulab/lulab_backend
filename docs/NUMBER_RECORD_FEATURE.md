# 参会者个性化会议总结功能

## 功能概述

我们成功实现了为每个参会者生成个性化会议总结的功能。该功能在会议录制文件处理完成后，为每个参会者生成专属的会议总结，并保存到飞书多维表格的 `number_record` 表中。

## 主要组件

### 1. 数据类型定义
- **文件**: `src/integrations/lark/types/number-record.types.ts`
- **接口**: 
  - `NumberRecordData`: 参会者总结数据结构
  - `UpdateNumberRecordData`: 更新参会者总结数据结构

### 2. 数据仓库
- **文件**: `src/integrations/lark/repositories/number-record.repository.ts`
- **类**: `NumberRecordBitableRepository`
- **方法**:
  - `createNumberRecord()`: 创建参会者总结记录
  - `upsertNumberRecord()`: 创建或更新参会者总结记录
  - `searchNumberRecordByParticipants()`: 根据参会者搜索记录
  - `updateNumberRecordById()`: 根据记录ID更新记录

### 3. 业务逻辑集成
- **文件**: `src/hook-tencent-mtg/services/event-handlers/recording-completed.handler.ts`
- **功能**: 在录制文件处理完成后，为每个参会者生成个性化总结

## 功能特点

### 个性化总结生成
1. **智能提示词**: 使用专业的会议总结助手角色设定
2. **个性化内容**: 包含参会者姓名、相关讨论、待办事项
3. **结构化输出**: 包含会议要点、相关讨论、待办事项、行动建议

### 数据存储
1. **参会者信息**: 存储参会者UUID和姓名
2. **个性化总结**: 存储AI生成的专属会议总结
3. **会议元数据**: 存储会议主题、时间、代码等关联信息

### 错误处理
1. **独立处理**: 每个参会者的总结生成独立处理，互不影响
2. **日志记录**: 详细的日志记录，便于问题追踪
3. **异常捕获**: 完善的异常处理，不影响主流程

## 配置要求

### 环境变量
在 `.env` 文件中添加：
```bash
LARK_TABLE_NUMBER_RECORD=your_number_record_table_id
```

### 飞书多维表格字段
`number_record` 表需要包含以下字段：
- `meet_participant`: 参会者信息（数组）
- `participant_summary`: 个性化会议总结
- `meet_data`: 会议相关数据（数组）

## 使用流程

1. **会议录制完成**: 腾讯会议录制文件生成
2. **触发处理**: Webhook事件触发录制完成处理
3. **AI分析**: 生成会议纪要、待办事项、转写文本
4. **参会者处理**: 为每个参会者生成个性化总结
5. **数据存储**: 保存到飞书多维表格

## 测试

### 单元测试
```bash
pnpm test:unit
```

### 构建验证
```bash
pnpm build
```

## 监控与调试

### 日志关键字
- `开始对参会者进行个性化会议总结`: 开始处理参会者总结
- `生成参会者总结成功`: 个性化总结生成成功
- `参会者总结记录已保存`: 数据保存成功
- `生成参会者总结失败`: 处理失败，查看错误信息

### 数据验证
在飞书多维表格中检查 `number_record` 表的数据：
1. 确认参会者信息正确
2. 验证个性化总结内容
3. 检查会议关联数据

## 扩展性

该功能设计具有良好的扩展性：
1. **提示词定制**: 可根据不同会议类型调整提示词
2. **数据字段**: 支持扩展更多的参会者相关数据
3. **总结格式**: 可调整总结的格式和内容结构
4. **集成扩展**: 可与其他系统集成，如邮件通知等