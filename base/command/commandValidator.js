class ValidationError {
  constructor(validator) {
    this.message = validator.reason || 'Validation failed.'
    this.validator = validator
  }

  toString() {
  	return this.message
  }
}

class Validator {
	constructor(cmd) {
		this.command = cmd
		this.exec = new Map()
		this.valid = true
		this.reason = ""
	}

	then(test, reason) {
		const finaltest = typeof test === 'function' ? test : () => test
		this.exec.set(finaltest, reason)
		return this
	}

	check(resolver, rejector) {
		return new Promise((resolve, reject) => {
			for(const [test, reason] of this.exec) {
				try {
					if(!test(this)) {
						this.reason = reason
						this.valid = false
						throw new ValidationError(this)
					}
				} catch(e) {
					this.command.channel.msg(e)
					return reject(e)
				}

				return resolve();
			}
		}).then(resolver, rejector)
	}
}

module.exports = Validator