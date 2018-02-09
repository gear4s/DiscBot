class Validator {
	constructor(cmd) {
		this.command = cmd
		this.exec = new Map()
		this.valid = true
		this.respond = true
		this.reason = ""
	}

	apply(test, reason) {
		const finaltest = typeof test === 'function' ? test : () => test
		this.exec.set(finaltest, reason)
		return this
	}

	then(resolver, rejector {
		return new Promise((resolve, reject) => {
			for(const [test, reason] of this.exec) {
				try {
					if(!test(this)) {
						this.reason = reason
						this.valid = false
						throw new Error(this)
					}
				} catch(e) {
					
				}
			}
		}}
	}
}