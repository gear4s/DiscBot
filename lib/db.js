const [Enmap, EnmapLevel] = [require("enmap"), require('enmap-level')]

class DBArray extends Array {
  constructor(array) {
    console.log(array)
    DBArray.injectClassMethods(array)
    super(...array)
  }

  array() {
    return Array.from(this.values());
  }

  keyArray() {
    return Array.from(this.keys());
  }

  first(count) {
    if(count === undefined) return this.values().next().value;
    if(typeof count !== 'number') throw new TypeError('The count must be a number.');
    if(!Number.isInteger(count) || count < 1) throw new RangeError('The count must be an integer greater than 0.');

    count = Math.min(this.size, count);
    const arr = new Array(count);
    const iter = this.values();

    for (let i = 0; i < count; i++) arr[i] = iter.next().value;
    return arr;
  }

  firstKey(count) {
    if(count === undefined) return this.keys().next().value;
    if(typeof count !== 'number') throw new TypeError('The count must be a number.');
    if(!Number.isInteger(count) || count < 1) throw new RangeError('The count must be an integer greater than 0.');

    count = Math.min(this.size, count);
    const arr = new Array(count);
    const iter = this.keys();

    for (let i = 0; i < count; i++) arr[i] = iter.next().value;
    return arr;
  }

  last(count) {
    const arr = this.array();
    if(count === undefined) return arr[arr.length - 1];
    if(typeof count !== 'number') throw new TypeError('The count must be a number.');
    if(!Number.isInteger(count) || count < 1) throw new RangeError('The count must be an integer greater than 0.');

    return arr.slice(-count);
  }

  lastKey(count) {
    const arr = this.keyArray();
    if(count === undefined) return arr[arr.length - 1];
    if(typeof count !== 'number') throw new TypeError('The count must be a number.');
    if(!Number.isInteger(count) || count < 1) throw new RangeError('The count must be an integer greater than 0.');

    return arr.slice(-count);
  }

  findAll(prop, value) {
    if(typeof prop !== 'string') throw new TypeError('Key must be a string.');
    if(typeof value === 'undefined') throw new Error('Value must be specified.');

    const results = [];
    for(const item of this.values()) {
      if(item[prop] === value) results.push(item);
    }

    return results;
  }

  find(propOrFn, value) {
    if(typeof propOrFn === 'string') {
      if(typeof value === 'undefined') throw new Error('Value must be specified.');

      for(const item of this.values()) {
        if(item[propOrFn] === value) return item;
      }

      return null;
    } else if(typeof propOrFn === 'function') {
      for(const [key, val] of this) {
        if(propOrFn(val, key, this)) return val;
      }

      return null;
    } else {
      throw new Error('First argument must be a property string or a function.');
    }
  }

  findKey(propOrFn, value) {
    if (typeof propOrFn === 'string') {
      if (typeof value === 'undefined') throw new Error('Value must be specified.');

      for (const [key, val] of this) {
        if (val[propOrFn] === value) return key;
      }

      return null;
    } else if (typeof propOrFn === 'function') {
      for (const [key, val] of this) {
        if (propOrFn(val, key, this)) return key;
      }

      return null;
    } else {
      throw new Error('First argument must be a property string or a function.');
    }
  }

  exists(prop, value) {
    return Boolean(this.find(prop, value));
  }

  filter(fn, thisArg) {
    if (thisArg) fn = fn.bind(thisArg);
    const results = [];

    for (const [key, val] of this) {
      if (fn(val, key, this)) results.push(val);
    }

    return results;
  }

  map(fn, thisArg) {
    if (thisArg) fn = fn.bind(thisArg);
    const arr = new Array(this.size);
    let i = 0;

    for (const [key, val] of this) arr[i++] = fn(val, key, this);
    return arr;
  }

  some(fn, thisArg) {
    if (thisArg) fn = fn.bind(thisArg);

    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }

    return false;
  }

  every(fn, thisArg) {
    if (thisArg) fn = fn.bind(thisArg);

    for (const [key, val] of this) {
      if (!fn(val, key, this)) return false;
    }

    return true;
  }

  reduce(fn, initialValue) {
    let accumulator;
    if (typeof initialValue !== 'undefined') {
      accumulator = initialValue;
      for (const [key, val] of this) accumulator = fn(accumulator, val, key, this);
    } else {
      let first = true;

      for (const [key, val] of this) {
        if (first) {
          accumulator = val;
          first = false;
          continue;
        }

        accumulator = fn(accumulator, val, key, this);
      }
    }
    return accumulator;
  }

  By(pre, item, value) {
    let once = obj => obj[item] == value
    if(typeof item === "object" && !Array.isArray(item)) {
      once = obj => {
        for(const index in item) {
          if(obj[index] !== item[index]) return false
        }
        return true
      }
    }
    return this[pre](once)
  }
  
  findBy(...args) {
    return this.By('find', ...args)
  }

  findByName(name) {
    return this.findBy("name", name)
  }
  
  findByID(id) {
    return this.findBy("id", id)
  }
  
  filterBy(...args) {
    return this.By('filter', ...args)
  }

  filterByName(name) {
    return this.findBy("name", name)
  }
  
  filterByID(id) {
    return this.findBy("id", id)
  }

  static fromArray(array) {
    const rarray = new DBArray(array)
    return rarray
  }

  static injectClassMethods(array) {
    for (const method in DBArray.prototype){
      if (DBArray.prototype.hasOwnProperty(method)){
        array[method] = DBArray.prototype[method];
      }
    }

    return array;
  };
}

class DB {
  constructor(dbname) {
    try {
      this.dbProvider = new EnmapLevel({ name: dbname })
      this.db = new Enmap({ provider: this.dbProvider })
    } catch(e) {
      return
    }
  }
  
  async init() {
    await this.db.defer
  }
  
  set(key, value) {
    this.db.set(key, value)
  }
  
  get(key, filter) {
    if(!this.db.get(key)) this.db.set(key, [])
    let gotten = this.db.get(key)
    if(filter) gotten = gotten.filter(filter)
    console.log(gotten)
    return DBArray.fromArray(gotten)
  }
  
  insert(key, unset, value) {
    const table = this.get(key)
    table.push(value)
    this.set(key, table)
  }
  
  async close() {
    await this.db.db.close()
  }
}

module.exports = {DB}
