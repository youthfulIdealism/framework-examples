import ky from 'ky';


import { Collection_User } from "./User.js"
import { Collection_Project } from "./Project.js"
import { Collection_Step } from "./Step.js"
import { Collection_Analytics } from "./Analytics.js"


export function api(base_url: string, get_auth: () => Promise<any>) {
    return new Api(base_url, get_auth)
}

class Api {
    base_url: string;
    get_auth: () => Promise<any>

    constructor(base_url: string, get_auth: () => Promise<any>) {
        this.base_url = base_url;
        this.get_auth = get_auth
    }

    collection(collection_id: "user"): Collection_User;
    collection(collection_id: "project"): Collection_Project;
    collection(collection_id: "step"): Collection_Step;
    collection(collection_id: "analytics"): Collection_Analytics;
    collection(collection_id: string) {
        switch(collection_id) {
            case "user":
                return new Collection_User([this.base_url, "user"], this.get_auth);
            case "project":
                return new Collection_Project([this.base_url, "project"], this.get_auth);
            case "step":
                return new Collection_Step([this.base_url, "step"], this.get_auth);
            case "analytics":
                return new Collection_Analytics([this.base_url, "analytics"], this.get_auth);
            default:
                throw new Error(`Api does not have the collection ${collection_id}`)
        }
    }
}