class Return {
	constructor(callback, await = false) {
		this.callback = callback

		// set defaults
		this.hasMultiple = false
		this.__array = false

		this.typeArray = ["number", "string", "object", "array", "undefined", "function"]
		this.expects = new Map(this.typeArray.map(e => [e, false]))

		for(const type of this.typeArray) {
			Object.defineProperty(this, type, {get() {
				this.expects.set(type, true); return {or: this.or, ok: this.ok, done: this.done}
			}})
		}
	}

	typeOf(that) {
		const _array = that instanceof Array && "array"
		const _class = this.expects.get("class") && that instanceof this.expects.get("class") && "class"
		return _array || _class || typeof that
	}

	get done() {
		const checkReturned = result => {
			const type = this.typeOf(result)
			const expects = Array.from(this.expects).filter(e=>e[1]).map(e=>e[0])
			if(!this.expects.get(type)) throw new Error(`Expected${type=="class"?" instance of ":" "}${expects}, got ${type}`)
			return result
		}

		return async function result(...args) {
			const returned = this.callback(...args)
			if(this.await) {
				return checkReturned(await returned)
			}
			return checkReturned(returned)
		}.bind(this)
	}

	get or() {
		this.hasMultiple = true
		return this
	}

	// this is special :D
	instance(of) {
		this.expects.set("class", of)
		return {or: this.or, ok: this.ok, done: this.done}
	}
}

exports.Return = Return