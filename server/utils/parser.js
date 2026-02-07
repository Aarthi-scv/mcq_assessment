function parseMCQ(text) {
  // Split by Separator#
  const blocks = text.split(/Separator#/).filter(block => block.trim().length > 0);
  
  const questions = blocks.map((block, index) => {
    try {
      const cleanBlock = block.trim();
      
      // 1. Create a qn key and the value get exactly before A. of the text
      // We look for the first occurrence of "A."
      const aIndex = cleanBlock.indexOf('A.');
      if (aIndex === -1) return null;
      
      let qnText = cleanBlock.substring(0, aIndex).trim();
      // Remove any leading numbers like "20."
      qnText = qnText.replace(/^\d+\.\s*/, '');
      
      // 2. Extract options A, B, C, D
      // Search for A., B., C., D. and Answer:
      const optAMatch = cleanBlock.match(/A\.\s+([\s\S]*?)\s+B\./);
      const optBMatch = cleanBlock.match(/B\.\s+([\s\S]*?)\s+C\./);
      const optCMatch = cleanBlock.match(/C\.\s+([\s\S]*?)\s+D\./);
      const optDMatch = cleanBlock.match(/D\.\s+([\s\S]*?)\s+Answer:/);
      
      const valA = optAMatch ? optAMatch[1].trim() : "";
      const valB = optBMatch ? optBMatch[1].trim() : "";
      const valC = optCMatch ? optCMatch[1].trim() : "";
      const valD = optDMatch ? optDMatch[1].trim() : "";
      
      // Create options key and store all value in array
      const options = [valA, valB, valC, valD];
      
      // 3. Create a answer key and get from Answer:
      // Note: the value in Answer: is only the option letter (A, B, C, or D)
      const answerMatch = cleanBlock.match(/Answer:\s*([A-D])/);
      const answerLetter = answerMatch ? answerMatch[1].trim() : "";
      
      // Map the letter to the proper value from options
      let answerValue = "";
      if (answerLetter === 'A') answerValue = valA;
      else if (answerLetter === 'B') answerValue = valB;
      else if (answerLetter === 'C') answerValue = valC;
      else if (answerLetter === 'D') answerValue = valD;
      
      // 4. Create Explanation key and get from Explanation:
      // Explanation might be followed by questionImage or end of block
      const expMatch = cleanBlock.match(/Explanation:\s*([\s\S]*?)(?:\s+questionImage:|$)/);
      const explanation = expMatch ? expMatch[1].trim() : "";
      
      // 5. Handle questionImage
      const imageMatch = cleanBlock.match(/questionImage:\s*(\S+)/);
      const questionImage = imageMatch ? imageMatch[1].trim() : null;
      
      if (qnText && valA && answerLetter) {
        return {
          id: (index + 1).toString(), // Add id for every qn
          qn: qnText,
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
