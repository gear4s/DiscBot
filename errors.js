// All throw errors here

module.exports = {}

module.exports.ConfigError = class {
	constructor(errlist) {
		this.errlist = errlist
	}
}
