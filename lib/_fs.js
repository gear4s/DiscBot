const fs = require("fs")

fs.existsWriteSync = async (i, d) => {
  if(!fs.existsSync(i))
    await fs.writeFileSync(i, d||"")
}

const _fs = class _fs {
  constructor(file) {
    this.file = file
  }
  
  get exists() {return fs.existsSync(this.file)}
  
  write(content) {
    return fs.writeFileSync(this.file, content, console.log);
  }
  
  unlink() {
    return fs.unlinkSync(this.file)
  }
  
  writeJson(content) {
    return this.write(JSON.stringify(content, null, 4))
  }
  
  get require() {
    delete require.cache[require.resolve(this.file)]
    this.required = require(this.file)
    return this.required
  }
}

module.exports = {fs, _fs}
