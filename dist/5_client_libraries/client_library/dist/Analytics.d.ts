import { analytics } from "./types/analytics.js";
import { analytics_query } from "./types/analytics_query.js";
import { analytics_put } from "./types/analytics_put.js";
import { analytics_post } from "./types/analytics_post.js";
export declare class Collection_Analytics {
    path: string[];
    get_auth: () => Promise<any>;
    collection_id: string;
    collection_name_plural: string;
    constructor(path: string[], get_auth: () => Promise<any>);
    query(query: analytics_query): Promise<analytics[]>;
    post(document: analytics_post): Promise<analytics>;
    document(document_id: string): Document;
}
declare class Document {
    path: string[];
    collection_id: string;
    document_id: string;
    collection_name_plural: string;
    get_auth: () => Promise<any>;
    constructor(path: string[], collection_id: string, document_id: string, collection_name_plural: string, get_auth: () => Promise<any>);
    get(): Promise<analytics>;
    put(update: analytics_put): Promise<analytics>;
    remove(): Promise<analytics>;
}
export {};
