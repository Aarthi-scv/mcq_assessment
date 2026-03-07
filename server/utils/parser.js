function parseMCQ(text) {
  console.log('[Parser] Starting extraction from text length:', text.length);

  // Split by ===QUESTION START===, handle case-insensitivity and multiple newlines
  const blocks = text.split(/===QUESTION START===/i).filter(block => block.trim().length > 0);
  console.log('[Parser] Found potential question blocks:', blocks.length);

  const questions = blocks.map((block, index) => {
    try {
      // Extract content between START and END markers
      const blockParts = block.split(/===QUESTION END===/i);
      let cleanBlock = blockParts[0].trim();

      if (!cleanBlock) return null;

      // Normalize whitespace: replace non-breaking spaces and simplify newlines
      cleanBlock = cleanBlock.replace(/\u00A0/g, ' ');

      // 1. Identify where options start (A. or A) or a. or a))
      // Be VERY flexible: Look for A followed by . or ) and optionally some space
      const optAStartMatch = cleanBlock.match(/(?:\s|^)A[\.\)]/i);
      if (!optAStartMatch) {
        console.warn(`[Parser] Skipping block ${index + 1}: Could not find Option A marker. Prefix: "${cleanBlock.substring(0, 50)}..."`);
        return null;
      }

      const aIndex = optAStartMatch.index;
      // Index of the actual "A" character (match might have a leading whitespace)
      const aCharIndex = cleanBlock.substring(aIndex, aIndex + 2).match(/A/i) ? aIndex : aIndex + 1;

      let rawQnText = cleanBlock.substring(0, aCharIndex).trim();

      // Separate CODE: if present
      let codeSnippet = "";
      let questionType = "plain";

      const codeLabelMatch = rawQnText.match(/CODE:\s*([\s\S]*)/i);
      if (codeLabelMatch) {
        questionType = "code";
        codeSnippet = codeLabelMatch[1].trim();
        rawQnText = rawQnText.split(/CODE:/i)[0].trim();
      }

      // Final cleanup of question text (remove QUESTION: label AND the question number)
      let qnText = rawQnText.replace(/QUESTION:\s*/gi, '').trim();
      qnText = qnText.replace(/^\d+[\.\)]?\s*/, '');

      // 2. Extract options A, B, C, D
      // Extremely flexible lookaheads
      const getOpt = (letter, nextLetters) => {
        const nextSelector = `(?:\\s+${nextLetters}[\\.\\)]|\\s+Answer:)`;
        const regex = new RegExp(`${letter}[\\.\\)]\\s*([\\s\\S]*?)(?=${nextSelector})`, 'i');
        const match = cleanBlock.match(regex);
        return match ? match[1].trim() : "";
      };

      let valA = getOpt('A', '[B-D]');
      let valB = getOpt('B', '[C-D]');
      let valC = getOpt('C', 'D');

      // Option D: everything until Answer:
      const optDMatch = cleanBlock.match(/D[\.\)]\s*([\s\S]*?)(?=\s+Answer:)/i);
      let valD = optDMatch ? optDMatch[1].trim() : "";

      // Cleanup: Strip labels if they leaked into options
      const stripLabels = (val) => val.replace(/^(?:OPTIONS|CODE|QUESTION):\s*/gi, '').trim();
      valA = stripLabels(valA);
      valB = stripLabels(valB);
      valC = stripLabels(valC);
      valD = stripLabels(valD);

      const options = [valA, valB, valC, valD];

      // 3. Extract Answer Letter
      const answerMatch = cleanBlock.match(/Answer:\s*([A-D])/i);
      const answerLetter = answerMatch ? answerMatch[1].toUpperCase() : "";
      const answerValue = options[['A', 'B', 'C', 'D'].indexOf(answerLetter)] || "";

      // 4. Extract Explanation
      const expMatch = cleanBlock.match(/Explanation:\s*([\s\S]*?)(?:\s+questionImage:|$)/i);
      const explanation = expMatch ? expMatch[1].trim() : "";

      // 5. Handle questionImage
      const imageMatch = cleanBlock.match(/questionImage:\s*(\S+)/i);
      const questionImage = imageMatch ? imageMatch[1].trim() : null;

      if (qnText && (valA || valB) && answerLetter) {
        console.log(`[Parser] Successfully parsed Question ${index + 1}`);
        return {
          id: (index + 1).toString(),
          qn: qnText,
          codeSnippet: codeSnippet,
          questionType: questionType,
          options: options,
          answer: answerValue,
          explanation: explanation,
          questionImage: questionImage
        };
      } else {
        console.warn(`[Parser] Question ${index + 1} rejected: qnText=${!!qnText}, valA=${!!valA}, answerLetter=${!!answerLetter}`);
      }
      return null;
    } catch (err) {
      console.error(`[Parser] Critical error in block ${index + 1}:`, err);
      return null;
    }
  }).filter(q => q !== null);

  console.log(`[Parser] Total successfully extracted: ${questions.length}`);
  return questions;
}

module.exports = { parseMCQ };
