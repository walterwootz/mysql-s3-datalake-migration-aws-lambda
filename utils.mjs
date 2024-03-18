import * as config from './config.mjs';

const columnTypes = {
    "DECIMAL": 0,
    "TINY": 1,
    "SHORT": 2,
    "LONG": 3,
    "FLOAT": 4,
    "DOUBLE": 5,
    "NULL": 6,
    "TIMESTAMP": 7,
    "LONGLONG": 8,
    "INT24": 9,
    "DATE": 10,
    "TIME": 11,
    "DATETIME": 12,
    "YEAR": 13,
    "NEWDATE": 14,
    "VARCHAR": 15,
    "BIT": 16,
    "JSON": 245,
    "NEWDECIMAL": 246,
    "ENUM": 247,
    "SET": 248,
    "TINY_BLOB": 249,
    "MEDIUM_BLOB": 250,
    "LONG_BLOB": 251,
    "BLOB": 252,
    "VAR_STRING": 253,
    "STRING": 254,
    "GEOMETRY": 255
  };

  function formatColumn(rawValue, columnType) {
    if(rawValue === null || rawValue === undefined) {
      return '';
    }
    if(columnType === columnTypes.BIT && rawValue.length === 1) {
      return rawValue.lastIndexOf(1) !== -1;
    }
    if (columnType === columnTypes.DATETIME) {
        let timezonedDate = new Date(rawValue.getTime() - (rawValue.getTimezoneOffset() * 60000));
        return timezonedDate.toISOString().replaceAll('T', ' ').replaceAll('Z', '').split('.')[0];
    }
    if (columnType === columnTypes.DATE) {
        let timezonedDate = new Date(rawValue.getTime() - (rawValue.getTimezoneOffset() * 60000));
        return timezonedDate.toISOString().split('T')[0];
    }
    return rawValue;
  }

  function isColumnIncluded(tableName, columnName) {
    let excludedList = config.rules.excludeColumns;
    for(let item of excludedList) {
      if(`${tableName}.${columnName}` === item) {
        return false;
      }
    }
    return true;
  }

  function isTableIncluded(tableName) {
    let patterns = config.rules.excludeTablesPatterns;
    for(let pattern of patterns) {
      let regex =  new RegExp(pattern);
      if(regex.test(tableName)) {
        return false;
      }
    }
    return true;
  }

export {
  formatColumn,
  isTableIncluded,
  isColumnIncluded
}
