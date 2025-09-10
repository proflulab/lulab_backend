// Lark Bitable field value types - 与飞书SDK保持一致
export type BitableFieldValue =
    | string
    | number
    | boolean
    | {
        text: string;
        link: string;
    }
    | {
        location: string;
        pname?: string;
        cityname?: string;
        adname?: string;
        address?: string;
        name?: string;
        full_address?: string;
    }
    | Array<{
        id: string;
        name?: string;
        avatar_url?: string;
    }>
    | Array<string>
    | Array<{
        id: string;
        name?: string;
        en_name?: string;
        email?: string;
        avatar_url?: string;
    }>
    | Array<{
        file_token: string;
        name?: string;
        type?: string;
        size?: number;
        url?: string;
        tmp_url?: string;
    }>;

// 字段映射类型
export interface BitableField {
    [key: string]: BitableFieldValue;
}

// 用户类型定义
export interface LarkUser {
    id: string;
    name?: string;
    en_name?: string;
    email?: string;
    avatar_url?: string;
}

// 记录类型定义
export interface LarkRecord {
    record_id: string;
    fields: BitableField;
    created_by: LarkUser;
    created_time: number;
    last_modified_by: LarkUser;
    last_modified_time: number;
    shared_url?: string;
    record_url?: string;
}

// 创建记录请求/响应
export interface CreateRecordRequest {
    app_token: string;
    table_id: string;
    fields: BitableField;
}

export interface CreateRecordResponse {
    code: number;
    msg: string;
    data?: {
        record: LarkRecord;
    };
}

// 更新记录请求/响应
export interface UpdateRecordRequest {
    app_token: string;
    table_id: string;
    record_id: string;
    fields: BitableField;
}

export interface UpdateRecordResponse {
    code: number;
    msg: string;
    data?: {
        record: LarkRecord;
    };
}

// Lark Client Configuration
export interface LarkClientConfig {
    appId: string;
    appSecret: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    baseUrl?: string;
}

// 搜索条件类型
export interface SearchFilterCondition {
    field_name: string;
    operator: 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isEmpty' | 'isNotEmpty' | 'isGreater' | 'isGreaterEqual' | 'isLess' | 'isLessEqual' | 'like' | 'in';
    value?: string[];
}

export interface SearchFilter {
    conjunction: 'and' | 'or';
    conditions?: SearchFilterCondition[];
    children?: Array<{
        conjunction: 'and' | 'or';
        conditions?: SearchFilterCondition[];
    }>;
}

export interface SearchSort {
    field_name: string;
    desc?: boolean;
}

// 搜索记录请求/响应
export interface SearchRecordRequest {
    app_token: string;
    table_id: string;
    view_id?: string;
    field_names?: string[];
    sort?: SearchSort[];
    filter?: SearchFilter;
    page_size?: number;
    page_token?: string;
    automatic_fields?: boolean;
    user_id_type?: 'user_id' | 'union_id' | 'open_id';
}

export interface SearchRecordResponse {
    code: number;
    msg: string;
    data?: {
        items: LarkRecord[];
        has_more: boolean;
        page_token?: string;
        total?: number;
    };
}

// 搜索记录迭代器选项
export interface SearchRecordIteratorOptions {
    app_token: string;
    table_id: string;
    page_size?: number;
    view_id?: string;
    field_names?: string[];
    sort?: SearchSort[];
    filter?: SearchFilter;
    user_id_type?: 'user_id' | 'union_id' | 'open_id';
}

// 列出记录请求/响应（兼容list接口）
export interface ListRecordRequest {
    app_token: string;
    table_id: string;
    view_id?: string;
    field_names?: string;
    filter?: string;
    sort?: string;
    page_size?: number;
    page_token?: string;
    text_field_as_array?: boolean;
    user_id_type?: 'user_id' | 'union_id' | 'open_id';
    display_formula_ref?: boolean;
    automatic_fields?: boolean;
}

export interface ListRecordResponse {
    code: number;
    msg: string;
    data?: {
        items: LarkRecord[];
        has_more: boolean;
        page_token?: string;
        total?: number;
    };
}

// 删除记录请求/响应
export interface DeleteRecordRequest {
    app_token: string;
    table_id: string;
    record_id: string;
}

export interface DeleteRecordResponse {
    code: number;
    msg: string;
}

// 批量创建记录请求/响应
export interface BatchCreateRecordRequest {
    app_token: string;
    table_id: string;
    records: Array<{
        fields: BitableField;
    }>;
}

export interface BatchCreateRecordResponse {
    code: number;
    msg: string;
    data?: {
        records: LarkRecord[];
    };
}

// 批量更新记录请求/响应
export interface BatchUpdateRecordRequest {
    app_token: string;
    table_id: string;
    records: Array<{
        record_id: string;
        fields: BitableField;
    }>;
    user_id_type?: 'user_id' | 'union_id' | 'open_id';
}

export interface BatchUpdateRecordResponse {
    code: number;
    msg: string;
    data?: {
        records: LarkRecord[];
    };
}

// 批量获取记录请求/响应
export interface BatchGetRecordRequest {
    app_token: string;
    table_id: string;
    record_ids: string[];
    user_id_type?: 'user_id' | 'union_id' | 'open_id';
    with_shared_url?: boolean;
    automatic_fields?: boolean;
}

export interface BatchGetRecordResponse {
    code: number;
    msg: string;
    data?: {
        records: LarkRecord[];
    };
}

// 批量删除记录请求/响应
export interface BatchDeleteRecordRequest {
    app_token: string;
    table_id: string;
    records: string[]; // record_id 数组
}

export interface BatchDeleteRecordResponse {
    code: number;
    msg: string;
    data: {
        records: Array<{
            deleted: boolean;
            record_id: string;
        }>;
    };
}

// Error response
export interface LarkErrorResponse {
    code: number;
    msg: string;
    error?: string;
}