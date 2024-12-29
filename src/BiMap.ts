export default class BiMap<T, U> {
    private _map1: Map<T, U> = new Map();
    private _map2: Map<U, T> = new Map();

    getFromKey(item1: T): U {
        return this._map1.get(item1);
    }

    getFromValue(item2: U): T {
        return this._map2.get(item2);
    }

    setFromKey(item1: T, item2: U) {
        this._map1.set(item1, item2);
        this._map2.set(item2, item1);
    }

    setFromValue(item1: U, item2: T) {
        this._map2.set(item1, item2);
        this._map1.set(item2, item1);
    }

    removeByKey(item1: T) {
        if (this._map1.has(item1)) {
            const value = this._map1.get(item1);
            this._map1.delete(item1);
            this._map2.delete(value);
        }
    }

    removeByValue(item2: U) {
        if (this._map2.has(item2)) {
            const value = this._map2.get(item2);
            this._map2.delete(item2);
            this._map1.delete(value);
        }
    }

    hasKey(item1: T) {
        return this._map1.has(item1);
    }

    hasValue(item2: U) { 
        return this._map2.has(item2);
    }
}