import SNBT from './index.js';
import fs from 'fs/promises';
import { Int } from './Structures.js';

fs.readFile('./sample.snbt', {encoding: 'utf-8'}).then( snbtStr => {
    const snbt = SNBT.parse(snbtStr);

    snbt.Fireworks.Flight = new Int(3);

    fs.writeFile('./output.snbt', SNBT.stringify(snbt, {indent: '\t'}), {encoding: 'utf-8'}).then( () => {
      console.log('Done!');
    });
});