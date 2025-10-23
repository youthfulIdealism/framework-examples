import ky from "ky";
import { encode_search_params } from "./utils/utils.js";
export class Collection_User {
    path;
    get_auth;
    collection_id;
    collection_name_plural;
    constructor(path, get_auth) {
        this.path = path;
        this.get_auth = get_auth;
        this.collection_id = "user";
        this.collection_name_plural = "users";
    }
    async query(query) {
        try {
            let result = await ky.get(this.path.join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
                searchParams: encode_search_params(query)
            }).json();
            return result.data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    async post(document) {
        try {
            let result = await ky.post(this.path.join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
                json: document
            }).json();
            return result.data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    document(document_id) {
        let path = this.path;
        let get_auth = this.get_auth;
        let collection_id = this.collection_id;
        let collection_name_plural = this.collection_name_plural;
        return new Document(path, collection_id, document_id, collection_name_plural, get_auth);
    }
}
class Document {
    path;
    collection_id;
    document_id;
    collection_name_plural;
    get_auth;
    constructor(path, collection_id, document_id, collection_name_plural, get_auth) {
        this.path = path;
        this.collection_id = collection_id;
        this.document_id = document_id;
        this.collection_name_plural = collection_name_plural;
        this.get_auth = get_auth;
    }
    async get() {
        try {
            let result = await ky.get([...this.path, this.document_id].join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
            }).json();
            return result.data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    async put(update) {
        try {
            let result = await ky.put([...this.path, this.document_id].join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
                json: update
            }).json();
            return result.data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    async remove() {
        try {
            let result = await ky.delete([...this.path, this.document_id].join('/'), {
                headers: {
                    authorization: await this.get_auth()
                },
            }).json();
            return result.data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
}
//# sourceMappingURL=User.js.map