import ky from "ky";
import { encode_search_params, Response, Response_Multiple } from "./utils/utils.js";


import { project } from "./types/project.js";
import { project_query } from "./types/project_query.js";
import { project_put } from "./types/project_put.js";
import { project_post } from "./types/project_post.js";

export class Collection_Project {
    path: string[]
    get_auth: () => Promise<any>
    collection_id: string
    collection_name_plural: string

    constructor(path: string[], get_auth: () => Promise<any>) {
        this.path = path;
        this.get_auth = get_auth;
        this.collection_id = "project";
        this.collection_name_plural = "projects"
    }

    
    async query(query: project_query): Promise<project[]>{
        try {
            let result = await ky.get(this.path.join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
                searchParams: encode_search_params(query)
            }).json() as Response_Multiple<project>;
            return result.data;
        } catch(err){
            return Promise.reject(err)
        }
    }

    async post(document: project_post): Promise<project>{
        try {
            let result = await ky.post(this.path.join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
                json: document
            }).json() as Response<project>;
            return result.data;
        } catch(err){
            return Promise.reject(err)
        }
    }

    document(document_id: string) {
        let path = this.path;
        let get_auth = this.get_auth;
        let collection_id = this.collection_id;
        let collection_name_plural = this.collection_name_plural;
        return new Document(path, collection_id, document_id, collection_name_plural, get_auth);
    }
}



class Document {
    path: string[];
    collection_id: string;
    document_id: string;
    collection_name_plural: string;
    get_auth: () => Promise<any>;

    constructor(path: string[], collection_id: string, document_id: string, collection_name_plural: string, get_auth: () => Promise<any>) {
        this.path = path;
        this.collection_id = collection_id;
        this.document_id = document_id;
        this.collection_name_plural = collection_name_plural;
        this.get_auth = get_auth;
    }

    async get(): Promise<project>{
        try {
            let result = await ky.get([...this.path, this.document_id].join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
            }).json() as Response<project>;
            return result.data;
        } catch(err){
            return Promise.reject(err)
        }
    }

    async put(update: project_put): Promise<project>{
        try {
            let result = await ky.put([...this.path, this.document_id].join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
                json: update
            }).json() as Response<project>;
            return result.data;
        } catch(err){
            return Promise.reject(err)
        }
    }
    
    async remove(): Promise<project>{
        try {
            let result = await ky.delete([...this.path, this.document_id].join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
            }).json() as Response<project>;
            return result.data;
        } catch(err){
            return Promise.reject(err)
        }
    }

}