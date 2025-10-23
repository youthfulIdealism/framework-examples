export type user_query = {
    "limit"?: number;
    "cursor"?: string;
    "sort_order"?: ("ascending" | "descending");
    "_id"?: string;
    "_id_gt"?: string;
    "_id_lt"?: string;
    "_id_in"?: string[];
    "name"?: string;
    "name_gt"?: string;
    "name_lt"?: string;
    "name_in"?: string[];
    "auth_system_id"?: string;
    "auth_system_id_gt"?: string;
    "auth_system_id_lt"?: string;
    "auth_system_id_in"?: string[];
    "sort"?: ("_id" | "name" | "auth_system_id");
};
