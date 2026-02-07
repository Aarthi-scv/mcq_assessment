const { parseMCQ } = require('./parser.js');

const testText = `20. Which code represents decimal digits using 4-bit binary numbers but disallows binary combinations above 1001? A. BCD B. Excess-3 C. Gray D. Parity Answer: A Explanation: BCD only uses binary values 0000 to 1001 for decimal digits 0–9. 

Separator#

20.Which issue is most likely present in this code? A. here is no problem; this is a proper CDC design. B. The signal sync1 may go metastable because it is sampled from a different clock domain without proper synchronization. C. The design is fully synchronous. D. The code will synthesize as a simple delay element. Answer: A Explanation: BCD only uses binary values 0000 to 1001 for decimal digits 0–9. questionImage: cdc_question.png`;

console.log('Testing parser...\n');

const result = parseMCQ(testText);

console.log('Number of questions parsed:', result.length);
console.log('\nParsed questions:');
console.log(JSON.stringify(result, null, 2));

if (result.length > 0) {
    const q1 = result[0];
    console.log('\nVerifying Q1:');
    console.log('QN:', q1.qn);
    console.log('Options:', q1.options);
    console.log('Answer:', q1.answer);
    console.log('Explanation:', q1.explanation);
    console.log('Image:', q1.questionImage);
}

if (result.length > 1) {
    const q2 = result[1];
    console.log('\nVerifying Q2:');
    console.log('QN:', q2.qn);
    console.log('Options:', q2.options);
    console.log('Answer:', q2.answer);
    console.log('Explanation:', q2.explanation);
    console.log('Image:', q2.questionImage);
}
