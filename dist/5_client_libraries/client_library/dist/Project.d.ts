import { project } from "./types/project.js";
import { project_query } from "./types/project_query.js";
import { project_put } from "./types/project_put.js";
import { project_post } from "./types/project_post.js";
export declare class Collection_Project {
    path: string[];
    get_auth: () => Promise<any>;
    collection_id: string;
    collection_name_plural: string;
    constructor(path: string[], get_auth: () => Promise<any>);
    query(query: project_query): Promise<project[]>;
    post(document: project_post): Promise<project>;
    document(document_id: string): Document;
}
declare class Document {
    path: string[];
    collection_id: string;
    document_id: string;
    collection_name_plural: string;
    get_auth: () => Promise<any>;
    constructor(path: string[], collection_id: string, document_id: string, collection_name_plural: string, get_auth: () => Promise<any>);
    get(): Promise<project>;
    put(update: project_put): Promise<project>;
    remove(): Promise<project>;
}
export {};
