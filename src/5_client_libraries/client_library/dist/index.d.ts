import { Collection_User } from "./User.js";
import { Collection_Project } from "./Project.js";
import { Collection_Step } from "./Step.js";
import { Collection_Analytics } from "./Analytics.js";
export declare function api(base_url: string, get_auth: () => Promise<any>): Api;
declare class Api {
    base_url: string;
    get_auth: () => Promise<any>;
    constructor(base_url: string, get_auth: () => Promise<any>);
    collection(collection_id: "user"): Collection_User;
    collection(collection_id: "project"): Collection_Project;
    collection(collection_id: "step"): Collection_Step;
    collection(collection_id: "analytics"): Collection_Analytics;
}
export {};
