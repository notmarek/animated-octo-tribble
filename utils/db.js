import fs from "fs";
import crypto from "crypto";

class DBFile {
    constructor(file_path) {
        if (!fs.existsSync(file_path.split("/").slice(0, -1).join("/"))) {
            fs.mkdirSync(file_path.split("/").slice(0, -1).join("/"), {
                recursive: true,
            });
        }
        if (!fs.existsSync(file_path)) {
            fs.writeFileSync(file_path, "{}");
        }
        
        this.path = file_path;
        
        this.db_file = fs.openSync(file_path, "r+");
    }

    read() {
        let len = fs.statSync(this.path).size;
        let buf = new Buffer.alloc(len);
        fs.readSync(this.db_file, buf, 0, len, 0);
        return buf;
    }

    read_json() {
        let content = this.read();
        return JSON.parse(content.length === 0 ? "{}" : content);
    }

    write(data) {
        fs.truncateSync(this.path, 0);
        fs.writeSync(this.db_file, JSON.stringify(data), 0, "utf8");
    }
}

export class Client {
    constructor(file_path) {
        this.db_file = new DBFile(file_path);
    }

    db(db_name) {
        return new Db(this.db_file, db_name);
    }

    async connect() {
        return this;
    }
}

export class Db {
    constructor(file, db_name) {
        this.db_file = file;
        this.db_name = db_name;
        this.data = this.db_file.read_json();
        if (!this.data[this.db_name]) {
            this.data[this.db_name] = {};
            this.db_file.write(this.data);
        }
    }

    collection(collection_name) {
        return new Collection(this.db_file, this.db_name, collection_name);
    }
}

export class Collection {
    constructor(file, db_name, collection_name) {
        this.db_file = file;
        this.db_name = db_name;
        this.collection_name = collection_name;
        this.data = this.db_file.read_json();
        if (!this.data[this.db_name][this.collection_name]) {
            this.data[this.db_name][this.collection_name] = [];
            this.db_file.write(this.data);
        }
    }
    
    find(query) {
        if (!query) 
            return new Matches(this.data[this.db_name][this.collection_name]);
        let matches = [];
        Object.keys(query).forEach((key) => {
            for (const entry of this.data[this.db_name][this.collection_name]) {
                if (entry[key] === query[key]) {
                    matches.push(entry);
                }
            }
        });
        return new Matches(matches);
    }

    async updateOne(query, updateDoc, options) {
        let key_to_update = Object.keys(updateDoc["$set"])[0];
        let value_to_update = updateDoc["$set"][key_to_update];
        Object.keys(query).forEach((key) => {
            for (const entry of this.data[this.db_name][this.collection_name]) {
                if (entry[key] === query[key]) {
                    entry[key_to_update] = value_to_update;
                    this.db_file.write(this.data);
                    return;
                }
            }
        });
    }

    remove(query) {
        Object.keys(query).forEach((key) => {
            for (const entry in this.data[this.db_name][this.collection_name]) {
                if (this.data[this.db_name][this.collection_name][entry][key] === query[key]) {
                    this.data[this.db_name][this.collection_name].splice(entry, 1)
                }
            }
        });
        this.db_file.write(this.data);
        return;
    }

    async insertOne(data) {
        data["_id"] = crypto.randomUUID();
        this.data[this.db_name][this.collection_name].push(data);
        this.db_file.write(this.data);
        return {
            insertedId: data["_id"],
        }
    }
}

export class Matches {
    constructor(matches) {
        this.matches = matches;
    }

    async toArray() {
        return this.matches;
    }

    async first() {
        return this.matches[0];
    }
}

export const client = new Client("./data.json");
export const connPromise = client.connect(); 