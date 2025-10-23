import { step } from "./types/step.js";
import { step_query } from "./types/step_query.js";
import { step_put } from "./types/step_put.js";
import { step_post } from "./types/step_post.js";
export declare class Collection_Step {
    path: string[];
    get_auth: () => Promise<any>;
    collection_id: string;
    collection_name_plural: string;
    constructor(path: string[], get_auth: () => Promise<any>);
    query(query: step_query): Promise<step[]>;
    post(document: step_post): Promise<step>;
    document(document_id: string): Document;
}
declare class Document {
    path: string[];
    collection_id: string;
    document_id: string;
    collection_name_plural: string;
    get_auth: () => Promise<any>;
    constructor(path: string[], collection_id: string, document_id: string, collection_name_plural: string, get_auth: () => Promise<any>);
    get(): Promise<step>;
    put(update: step_put): Promise<step>;
    remove(): Promise<step>;
}
export {};
