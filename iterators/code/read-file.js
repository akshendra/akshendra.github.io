/**
 * Will read a file line by line
 */

const path = require('path');
const _ = require('lodash');
const fs = require('fs');

async function* reader(filePath) {
  const stream = fs.createReadStream(filePath, {
    encoding: 'utf-8',
  });

  let line = '';
  for await (const chunk of stream) {
    line += chunk;
    const eolIndex = _.lastIndexOf(line, '\n');
    if (eolIndex >= 0) {
      const splits = _.split(line, '\n');
      line = _.last(splits);
      lines = _.take(splits, splits.length - 1);
      for (l of lines) {
        yield l;
      }
    }
  }
  yield line;
};

async function print() {
  let i = 0;
  for await (const line of reader(path.join(__dirname, 'quotes'))) {
    i += 1;
    console.log(`${i}. ${line}`);
  }
}


print().then(() => console.log('Done.')).catch(console.error);