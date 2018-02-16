const {EventEmitter} = require("events")
const {ConfigError} = require("./errors.js")

class Validator extends EventEmitter {
	constructor(value) {
    super()
		this.value = value
		this.error = false
	}

	instanceof(Class) {
		if(this.value instanceof Class === false) this.error = true
		return this
	}

	typeof(value) {
		if(typeof this.value !== value) this.error = true
		return this
	}

	neq(val) {
		if(this.value !== val) this.error = true
		return this
	}

	eq(val) {
		if(this.value === val) this.error = true
		return this
	}

}

class Config extends EventEmitter {
	constructor(options) {
    super()
		this.options = options
		this.error = []
	}

	checkSingles() {
    const modules = new Validator(this.modules)
    if(modules.instanceof(Array).eq("dynamic").error) {
      this.error.push("The \"modules\" objective has to be either an array of modules you will load, or it must be set to \"dynamic\" to enable dynamic loading")
      this.modules = "dynamic"
    }

    const name = new Validator(this.name)
    if(name.typeof("string").error) {
      this.error.push("The \"name\" objective has to be of type \"string\"")
      this.name = "DiscBot"
    }

    const folders = new Validator(this.folders)
    if(folders.typeof("object").error) {
      this.error.push("The \"folders\" objective has to be an instance of an Object")
      this.folders = {
        module: "modules",
        base: "base",
        libraries: "lib",
        util: "util"
      }
    }
	}

	checkFolders() {
		const module = new Validator(this.folders.module)
    if(module.typeof("string").error) {
      this.error.push("The \"module\" directive of the \"folders\" objective is invalid")
      this.folders.modules = "modules"
    }

		const base = new Validator(this.folders.base)
    if(base.typeof("string").error) {
      this.error.push("The \"base\" directive of the \"folders\" objective is invalid")
      this.folders.base = "base"
    }

		const libraries = new Validator(this.folders.libraries)
    if(libraries.typeof("string").error) {
      this.error.push("The \"libraries\" directive of the \"folders\" objective is invalid")
      this.folders.libraries = "lib"
    }

		const util = new Validator(this.folders.util)
    if(util.typeof("string").error) {
      this.error.push("The \"util\" directive of the \"folders\" objective is invalid")
      this.folders.util = "util"
    }
	}

	validate(keyList) {
		let key = this.options

		const token = new Validator(this.options.token)
		token.instanceof(String)
    if(this.options.token instanceof String === false) this.emit("fatal", "Your token is not of type string")

    this.name = this.options.name
    this.modules = this.options.modules
    this.folders = this.options.folders
    this.token = this.options.token

    this.checkSingles()
    this.checkFolders()

    if(this.error.length) this.emit("error", new ConfigError(this.error))
  }
}

module.exports = Config