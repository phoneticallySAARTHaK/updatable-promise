type ExternalExecutor<T> = {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (value: T | PromiseLike<T>) => void;
};
/** Promises that can updated to different value, and all the pending `await`s will be updated as well.
 * Behaves just like native promises
 */
interface UpdatablePromise<T> extends Promise<T> {
    /**
     *
     * @param v The new Promise
     * @param executor optional executor for this promise
     */
    update(v: Promise<T>, executor?: ExternalExecutor<T>): void;
}
declare class UpdatablePromise<T> implements UpdatablePromise<T> {
    private value;
    private executors;
    /**
     * @param prom - the default promise object
     * @param executor - optional ExternalExecutor argument to store executor internally.
     * @returns UpdatablePromise
     */
    constructor(prom: Promise<T>, executor?: ExternalExecutor<T>);
}
export default UpdatablePromise;
