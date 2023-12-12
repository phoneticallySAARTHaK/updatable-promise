class UpdatablePromise {
    value;
    executors;
    /**
     * @param prom - the default promise object
     * @param executor - optional ExternalExecutor argument to store executor internally.
     * @returns UpdatablePromise
     */
    constructor(prom, executor) {
        this.value = undefined;
        this.executors = [];
        if (executor)
            this.executors.push(Object.assign({}, executor));
        /**
         * Call previous resolve/reject functions to fulfil previous promises, if any.
         * helper function, just to reduce code duplication in `update` function.
         */
        const prevResolvers = (type) => {
            return (val) => {
                const flag = type === 'reject';
                while (true) {
                    const executor = this.executors.shift();
                    if (executor)
                        flag ? executor.reject(val) : executor.resolve(val);
                    else
                        break;
                }
                return val;
            };
        };
        const handler = {
            get: (target, prop) => {
                // console.log(prop);
                if (prop === 'update') {
                    // return a function which takes the new promise value and its executor as argument
                    return (v, executor) => {
                        // console.log('upd', v, this.value);
                        this.value = v;
                        if (executor)
                            this.executors.push(executor);
                        // attach `then` function to the new promise, so that the old promises are fulfilled when the new one does
                        // this has no effect on already fulfilled promises.
                        v.then((val) => prevResolvers('resolve')(val), (val) => prevResolvers('reject')(val));
                    };
                }
                else if (typeof this.value === 'undefined') {
                    // if value is undefined, i.e. promise was never updated, return default property values
                    return typeof target[prop] === 'function'
                        ? target[prop].bind(target)
                        : target[prop];
                }
                // else,  attach functions to new promise
                else if (prop === 'then') {
                    //   console.log('then', this.value);
                    return (onfulfilled, onrejected) => this.value.then(onfulfilled, onrejected);
                }
                else if (prop === 'catch') {
                    return (onrejected) => this.value.catch(onrejected);
                }
                else if (prop === 'finally') {
                    return (onfinally) => this.value.finally(onfinally);
                }
                else
                    return target[prop];
            },
        };
        return new Proxy(prom, handler);
    }
}
const ex = {
    resolve: () => void 0,
    reject: () => void 0
};
const prom = new Promise((resolve, reject) => {
    ex.resolve = resolve;
    ex.reject = reject;
});
const up = new UpdatablePromise(prom, ex);
setTimeout(() => ex.resolve("resolved"), 1000);
console.log(await up);
setTimeout(async () => {
    up.update(Promise.reject("reject"));
    console.log(await up);
}, 2000);
setTimeout(async () => {
    up.update(Promise.resolve("res again"));
    console.log(await up);
}, 2500);
export {};
