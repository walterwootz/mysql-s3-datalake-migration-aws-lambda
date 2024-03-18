const main = {
    aws: {
        bucket: 'BUCKET_NAME'
    },
    db: {
        host: 'DB_HOST',
        user: 'DB_USER',
        database: 'DB_NAME',
        password: 'DB_PASSWORD',
        port: DB_PORT,
        isServer: false,
        ssl: { rejectUnauthorized: false}
    },
    exportHeader: false,
    csvSeparator: ',',
    enclosure: true
};

const rules = {
    // Option 1: Specify tables you want to migrate...
    specificTablesOnly: [
        'TABLE_NAME'
    ],
    // Option 2: ...or migrate anything and define regex to exclude some tables
    excludeTablesPatterns: [
        'EXCLUDED_TABLES_REGEX'
    ],
    // Rules evalated in both options 1 and 2
    excludeColumns: [
        'table_name.table_column',
        'table_name.table_column'
    ]
};

export {
    main,
    rules
};
