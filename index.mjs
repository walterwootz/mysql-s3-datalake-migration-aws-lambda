import mysql2 from 'mysql2/promise';
import fs from 'fs';
import * as Utils from './utils.mjs';
import * as Config from './config.mjs';
import * as AWS from "@aws-sdk/client-s3";
import path from "path";
import * as Logger from './logger.mjs';

var connection;
var prefix = Config.main.db.database;
var failedTables = [];

export const handler = async (event, context) => {
    const migration = await run();
    return migration;
};

async function run() {
    Logger.info(`Running configuration: \n${JSON.stringify(Config.main, null, 4)}`);
    Logger.info(`Running rules: \n${JSON.stringify(Config.rules, null, 4)}`);
    
    let connectionConfig = Config.main.db;
    connection = await mysql2.createConnection(connectionConfig);
    
    let reqTables = Config.rules.specificTablesOnly.length>0 ? Config.rules.specificTablesOnly : await getAllTablesWithRules();
    let csvTables = [];
    let s3Tables = [];
    for(let table of reqTables) {
        try {
            
            await exportTableCSV(table);
            csvTables.push(table);
            
            await uploadCsvFileToS3(`/tmp/${table}.csv`);   
            s3Tables.push(table);
            
            await fs.unlinkSync(`/tmp/${table}.csv`);
    
        } catch (e) {
            failedTables.push(table);
            Logger.info(`Cannot complete export of ${table}. Error: ${e}`);
        }
    }
    return {reqTables, csvTables, s3Tables, failedTables, logs: Logger.logs};
}

async function uploadCsvFileToS3(filepath) {
    Logger.info(`Start uploading ${filepath}`);
    let s3 = new AWS.S3();
    let uploadParams = { Bucket: Config.main.aws.bucket, Key: '', Body: '' };
    var fileStream = fs.createReadStream(filepath);
    fileStream.on('error', function (err) {
        Logger.info('File Error', err);
        return;
    });
    uploadParams.Body = fileStream;
    
    let tableName = path.basename(filepath).split('.')[0];
    uploadParams.Key = `${prefix}/${tableName}/DATA.csv`;

    const stored = await putObjectWrapper(s3, uploadParams);
    if (!stored) {
        Logger.info(`Cannot upload ${filepath}`);
        throw 'upload failed';
    }
    if (stored) {
        Logger.info(`Successful upload ${filepath}`, stored);
    }
}

async function getAllTablesWithRules() {
    let tables = [];
    let [rows, fields] = await connection.execute('show tables');
    for(let row of rows) {
        for(let field of fields) {
            if(Utils.isTableIncluded(row[field.name])) {
                tables.push(row[field.name]);
            }
        }
    }
    return tables;
}

async function exportTableCSV(table) {
    Logger.info(`Starting CSV export of ${table}`);
    let [_, allFields] = await connection.execute(`select * from ${table} limit 1`);

    let projection = '';
    for(let field of allFields) {
        if(Utils.isColumnIncluded(table, field.name)) {
            projection += `${field.name},`;
        }
    }
    projection = projection.slice(0,-1);

    let query = `select ${projection} from ${table}`;
    let [rows, fields] = await connection.execute(query);
    Logger.info(`Rows found: ${rows.length}`);
    const filePath = `/tmp/${table}.csv`;
    const csv = fs.openSync(filePath, 'w');

    if(Config.main.exportHeader) {
        let header = '';
        for(let field of fields) {
            header += Config.main.enclosure ? `"${field.name}"${Config.main.csvSeparator}` : `${field.name}${Config.main.csvSeparator}`;
        }
        header = header.slice(0,-1);
        fs.writeFileSync(csv,`${header}\n`);
    }

    for(let row of rows) {
        let line = "";
        for(let field of fields) {
            line += Config.main.enclosure ? `"${Utils.formatColumn(row[field.name], field.columnType)}"${Config.main.csvSeparator}`
            : `${Utils.formatColumn(row[field.name], field.columnType)}${Config.main.csvSeparator}`;
        }
        line = line.slice(0,-1);
        fs.writeFileSync(csv,`${line}\n`);
    }
    Logger.info(`Finished CSV export of ${table}`);
}

const putObjectWrapper = (s3, params) => {
  return new Promise((resolve, reject) => {
    s3.putObject(params, function (err, result) {
      if(err) return reject(err);
      if(result) return resolve(result);
    });
  })
}
