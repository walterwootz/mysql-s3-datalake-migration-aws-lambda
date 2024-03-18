var logs = [];

const info = (text) => {
    logs.push(`${(new Date()).toISOString()} - ${text}`);
    console.log(text);
}

export {
    logs,
    info
};
