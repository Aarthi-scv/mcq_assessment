function parseMCQ(text) {
  // Split by ===QUESTION START===
  const blocks = text.split(/===QUESTION START===/i).filter(block => block.trim().length > 0);

  const questions = blocks.map((block, index) => {
    try {
      // Content is everything before ===QUESTION END===
      const cleanBlock = block.split(/===QUESTION END===/i)[0].trim();

      // 1. Identify where options start (A. or A))
      const optAStartMatch = cleanBlock.match(/\s+A[\.\)]/);
      if (!optAStartMatch) return null;

      const aIndex = optAStartMatch.index;
      let rawQnText = cleanBlock.substring(0, aIndex).trim();

      // Remove any leading numbers like "20." or "20)"
      rawQnText = rawQnText.replace(/^\d+[\.\)]\s*/, '');

      // Separate CODE: if present
      let codeSnippet = "";
      let questionType = "plain";

      const codeLabelMatch = rawQnText.match(/CODE:\s*([\s\S]*)/i);
      if (codeLabelMatch) {
        questionType = "code";
        codeSnippet = codeLabelMatch[1].trim();
        rawQnText = rawQnText.split(/CODE:/i)[0].trim();
      }

      // Final cleanup of question text
      const qnText = rawQnText.replace(/QUESTION:\s*/gi, '').trim();

      // 2. Extract options A, B, C, D
      const optAMatch = cleanBlock.match(/A[\.\)]\s+([\s\S]*?)\s+B[\.\)]/i);
      const optBMatch = cleanBlock.match(/B[\.\)]\s+([\s\S]*?)\s+C[\.\)]/i);
      const optCMatch = cleanBlock.match(/C[\.\)]\s+([\s\S]*?)\s+D[\.\)]/i);
      const optDMatch = cleanBlock.match(/D[\.\)]\s+([\s\S]*?)\s+Answer:/i);

      let valA = optAMatch ? optAMatch[1].trim() : "";
      let valB = optBMatch ? optBMatch[1].trim() : "";
      let valC = optCMatch ? optCMatch[1].trim() : "";
      let valD = optDMatch ? optDMatch[1].trim() : "";

      // Remove labels if they leaked into options
      valA = valA.replace(/^OPTIONS:\s*/gi, '').trim();

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

      if (qnText && valA && answerLetter) {
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
      }
      return null;
    } catch (err) {
      console.error('Parser error:', err);
      return null;
    }
  }).filter(q => q !== null);

  return questions;
}

module.exports = { parseMCQ };
