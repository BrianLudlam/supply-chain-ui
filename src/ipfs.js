const IPFS = require('ipfs-http-client');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
const ITEM_FILE_PATH = '/SupplyChainItem';
const NODE_FILE_PATH = '/SupplyChainNode';
const STEP_FILE_PATH = '/SupplyChainStep';

const writeIPFile = async (path, file) => {
  const ipFile = {
    path,
    content: IPFS.Buffer.from(JSON.stringify(file))
  };
  //console.log('writeIPFile ipFile: ', ipFile);
  let fileHash = undefined;
  try {
    const results = await ipfs.add(ipFile);
    console.log('writeItemFile results: ', results);
    if (!!results && results[0] && results[0].hash) fileHash = results[0].hash;
    else console.error('writeItemFile fileHash null.');
    //console.log('writeItemFile fileHash: ', fileHash);
  } catch (e) {
    console.error('writeItemFile fail e:', e);
  } finally {
    return fileHash;
  }
}

const hashIPFile = async (path, file) => {
  const ipFile = {
    path,
    content: IPFS.Buffer.from(JSON.stringify(file))
  };
  //console.log('writeIPFile ipFile: ', ipFile);
  let fileHash = undefined;
  try {
    const results = await ipfs.add(ipFile, {onlyHash: true});
    console.log('hashIPFile results: ', results);
    if (!!results && results[0] && results[0].hash) fileHash = results[0].hash;
    else console.error('hashIPFile fileHash null.');
    //console.log('writeItemFile fileHash: ', fileHash);
  } catch (e) {
    console.error('hashIPFile fail e:', e);
  } finally {
    return fileHash;
  }
}

export const hashNodeFile = async (file) => hashIPFile(NODE_FILE_PATH, file);

export const writeItemFile = async (file) => writeIPFile(ITEM_FILE_PATH, file);
export const writeNodeFile = async (file) => writeIPFile(NODE_FILE_PATH, file);
export const writeStepFile = async (file) => writeIPFile(STEP_FILE_PATH, file);

export const readIPFile = async (fileHash) => {
  //console.log('readIPFile fileHash: ', fileHash);
  let file = undefined;
  if (!fileHash) return file;
  try {
    const jsonFile = await ipfs.cat(fileHash);
    console.log('readIPFile jsonFile: ', jsonFile);
    if (!!jsonFile) file = JSON.parse(jsonFile);
    else console.error('readIPFile null from cat.');
    //console.log('readIPFile file: ', file);
  } catch (e) {
    console.error('readIPFile fail e:', e);
  } finally {
    return file;
  }
}

/* Test IPFS functionality */
const testIpfs = async () => {
  const { writeItemFile, readIPFile } = require('./ipfs');
  const itemFile = {
    name: "Test Item "+Date.now(),
    desc: "Testing item write to ipfs, woohoo!"
  };
  const itemFileHash = await writeItemFile(itemFile);
  if (!!itemFileHash) {
    console.log('testIpfs writeIPFile itemFileHash: ', itemFileHash);
    const file = await readIPFile(itemFileHash);
    if (!!file) console.log('testIpfs readIPFile file: ', file);
    else console.log('testIpfs readIPFile fail');
  } else console.log('testIpfs writeIPFile fail');
}
