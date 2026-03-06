const fs = require('fs');
const path = require('path');
const { parseDocx } = require('./utils/docxParser');

async function testParser() {
    try {
        const filePath = path.join('D:', 'test mcq', 'mcq_assessment', 'server', 'utils', 'mcq.docx');
        const buffer = fs.readFileSync(filePath);
        console.log('File size:', buffer.length);

        const questions = await parseDocx(buffer);
        console.log('Parsed Questions Count:', questions.length);
        console.log(JSON.stringify(questions, null, 2));
    } catch (err) {
        console.error('Test Error:', err);
    }
}

testParser();
