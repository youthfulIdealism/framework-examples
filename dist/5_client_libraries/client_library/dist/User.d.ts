import { user } from "./types/user.js";
import { user_query } from "./types/user_query.js";
import { user_put } from "./types/user_put.js";
import { user_post } from "./types/user_post.js";
export declare class Collection_User {
    path: string[];
    get_auth: () => Promise<any>;
    collection_id: string;
    collection_name_plural: string;
    constructor(path: string[], get_auth: () => Promise<any>);
    query(query: user_query): Promise<user[]>;
    post(document: user_post): Promise<user>;
    document(document_id: string): Document;
}
declare class Document {
    path: string[];
    collection_id: string;
    document_id: string;
    collection_name_plural: string;
    get_auth: () => Promise<any>;
    constructor(path: string[], collection_id: string, document_id: string, collection_name_plural: string, get_auth: () => Promise<any>);
    get(): Promise<user>;
    put(update: user_put): Promise<user>;
    remove(): Promise<user>;
}
export {};
