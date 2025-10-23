export function encode_search_params(params) {
    let retval = {};
    for (let [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
            retval[key] = value.join(',');
        }
        else if (value instanceof Date) {
            retval[key] = value.toISOString();
        }
        else {
            retval[key] = value;
        }
    }
    return retval;
}
//# sourceMappingURL=utils.js.map