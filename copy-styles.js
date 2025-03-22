import ncp from 'ncp';
import path from 'path';

const DATA_FILE = path.join('src', 'styles.css');
const OUTPUT_FILE = path.join('dist', 'styles.css');

ncp(DATA_FILE, OUTPUT_FILE, (err) => {
  if (err) {
    console.error('Error copying style.css:', err);
    process.exit(1);
  }
  console.log('style.css copied to dist');
});
