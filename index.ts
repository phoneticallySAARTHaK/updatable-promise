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

class UpdatablePromise<T> implements UpdatablePromise<T> {
  private value: Promise<T> | undefined;
  private executors: ExternalExecutor<T>[];

  /**
   * @param prom - the default promise object
   * @param executor - optional ExternalExecutor argument to store executor internally.
   * @returns UpdatablePromise
   */
  constructor(prom: Promise<T>, executor?: ExternalExecutor<T>) {
    this.value = undefined;
    this.executors = [];
    if (executor) this.executors.push(Object.assign({}, executor));

    /**
     * Call previous resolve/reject functions to fulfil previous promises, if any.
     * helper function, just to reduce code duplication in `update` function.
     */
    const prevResolvers = (type: 'resolve' | 'reject') => {
      return (val: T) => {
        const flag = type === 'reject';
        while (true) {
          const executor = this.executors.shift();
          if (executor) flag ? executor.reject(val) : executor.resolve(val);
          else break;
        }
        return val;
      };
    };

    const handler: ProxyHandler<Promise<T>> = {
      get: (target, prop: keyof Promise<T> | 'update') => {
        // console.log(prop);
        if (prop === 'update') {
          // return a function which takes the new promise value and its executor as argument
          return (v: Promise<T>, executor?: ExternalExecutor<T>) => {
            // console.log('upd', v, this.value);
            this.value = v;
            if (executor) this.executors.push(executor);
            // attach `then` function to the new promise, so that the old promises are fulfilled when the new one does
            // this has no effect on already fulfilled promises.
            v.then(
              (val) => prevResolvers('resolve')(val),
              (val) => prevResolvers('reject')(val),
            );
          };
        } else if (typeof this.value === 'undefined') {
          // if value is undefined, i.e. promise was never updated, return default property values
          return typeof target[prop] === 'function'
            ? (target[prop] as Function).bind(target)
            : target[prop];
        }
        // else,  attach functions to new promise
        else if (prop === 'then') {
        //   console.log('then', this.value);
          return (
            onfulfilled?: ((value: T) => T | Promise<T>) | undefined | null,
            onrejected?: ((reason: any) => T | Promise<T>) | undefined | null,
          ) => (this.value as Promise<T>).then(onfulfilled, onrejected);
        } else if (prop === 'catch') {
          return (
            onrejected?: ((reason: any) => T | Promise<T>) | undefined | null,
          ) => (this.value as Promise<T>).catch(onrejected);
        } else if (prop === 'finally') {
          return (onfinally?: (() => void) | undefined | null) =>
            (this.value as Promise<T>).finally(onfinally);
        } else return target[prop];
      },
    };

    return new Proxy(prom, handler) as unknown as UpdatablePromise<T>;
  }
}

const ex: ExternalExecutor<string> = {
    resolve: () => void 0,
    reject: () => void 0
};

  const prom = new Promise<string>((resolve, reject) => {
    ex.resolve = resolve;
    ex.reject = reject;
  });

  const up = new UpdatablePromise(prom, ex);

  setTimeout(() => ex.resolve("resolved"), 1000);
  console.log(await up)

setTimeout(async () => {
    up.update(Promise.reject("reject"));
    console.log(await up)
}, 2000);
  

setTimeout(async () => {
    up.update(Promise.resolve("res again"));
    console.log(await up)
}, 2500);
  


export default UpdatablePromise;
