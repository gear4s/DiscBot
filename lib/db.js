const [Enmap, EnmapLevel] = [require("enmap"), require('enmap-level')]

class DBArray extends Array {
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

    let saved = this[pre](once)
    if(typeof saved === "object" && !Array.isArray(saved)) 
    	saved = [saved]

    return saved
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
  	console.log(this.By('filter', ...args)[0])
    return this.By('filter', ...args)
  }

  filterByName(name) {
    return this.findBy("name", name)
  }
  
  filterByID(id) {
    return this.findBy("id", id)
  }
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
  
  get(key) {
    if(!this.db.get(key)) this.db.set(key, [])
    let gotten = this.db.get(key)
  console.log(gotten)
    return new DBArray(...gotten)
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
