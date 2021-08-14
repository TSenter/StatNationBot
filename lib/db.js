const fs = require('fs');

class Db {
  data = {};
  filename = '';

  constructor(name) {
    this.filename = `./data/${name}.json`;
    if (fs.existsSync(this.filename)) {
      this.data = JSON.parse(fs.readFileSync(this.filename));
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
  }

  save() {
    fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
  }
}

const dbs = {};

module.exports = {
  getDb: function(name) {
    if (dbs[name] == undefined) {
      dbs[name] = new Db(name);
    }
    return dbs[name];
  },
  async saveAllDbs() {
    for (const name in dbs) {
      await dbs[name].save();
    }
  }
}