const mammoth = require('mammoth');
const { uploadImage } = require('./cloudinary');

async function parseDocx(buffer) {
    const images = [];

    // Custom image handler to collect images and use placeholders in the text
    const options = {
        convertImage: mammoth.images.inline((element) => {
            return element.read().then(async (imageBuffer) => {
                // We'll upload later or use a temporary ID to match
                const imageId = `IMG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                images.push({ imageId, buffer: imageBuffer, contentType: element.contentType });
                return {
                    src: `{{${imageId}}}`
                };
            });
        })
    };

    const result = await mammoth.convertToHtml({ buffer }, options);
    const html = result.value;

    // Split by markers - being flexible with tags around them
    const chunks = html.split(/===QUESTION START===/g);
    const parsedQuestions = [];

    for (const chunk of chunks) {
        if (!chunk.trim() || !chunk.includes('===QUESTION END===')) continue;

        let content = chunk.split(/===QUESTION END===/)[0];

        // 1. Extract potential image placeholders before stripping HTML
        const imgPlaceholders = [];
        const imgRegex = /{{(IMG_.*?)}}/g;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(content)) !== null) {
            imgPlaceholders.push(imgMatch[1]);
        }

        // 2. Strip all HTML tags to make regex matching easier
        content = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        // console.log('DEBUG Content:', content); // Uncomment if needed

        const q = {
            qn: '',
            options: [],
            answer: '',
            explanation: '',
            questionImage: null
        };

        // 3. Extract Question Text
        // Look for something like "1. ... A)" or just "... A)"
        const qnMatch = content.match(/^(?:(\d+[\.\)])\s*)?([\s\S]*?)\s+[A-D]\)/i);
        if (qnMatch) {
            q.qn = qnMatch[2].trim();
            // If there's a number, include it if it's part of the question text
            if (qnMatch[1]) {
                q.qn = qnMatch[1] + " " + q.qn;
            }
        } else {
            // Fallback: If no A) found, maybe the whole thing is the question
            // But we need options, so let's check why A) wasn't found
            console.warn('DEBUG: No A) found in content chunk');
        }

        // 4. Extract Options
        // Using more flexible regex for options
        const optAMatch = content.match(/A\)\s*([\s\S]*?)\s+B\)/i);
        const optBMatch = content.match(/B\)\s*([\s\S]*?)\s+C\)/i);
        const optCMatch = content.match(/C\)\s*([\s\S]*?)\s+D\)/i);
        const optDMatch = content.match(/D\)\s*([\s\S]*?)\s+Answer:/i);

        q.options = [
            optAMatch ? optAMatch[1].trim() : '',
            optBMatch ? optBMatch[1].trim() : '',
            optCMatch ? optCMatch[1].trim() : '',
            optDMatch ? optDMatch[1].trim() : ''
        ];

        // 5. Extract Answer
        const ansMatch = content.match(/Answer:\s*([A-D])/i);
        if (ansMatch) {
            const answerLetter = ansMatch[1].toUpperCase();
            q.answer = q.options[['A', 'B', 'C', 'D'].indexOf(answerLetter)];
        }

        // 6. Extract Explanation
        const expMatch = content.match(/Explanation:\s*([\s\S]*)$/i);
        if (expMatch) {
            q.explanation = expMatch[1].trim();
        }

        // 7. Handle image - if we found a placeholder anywhere in the content chunk
        if (imgPlaceholders.length > 0) {
            const imageObj = images.find(img => img.imageId === imgPlaceholders[0]);
            if (imageObj) {
                try {
                    q.questionImage = await uploadImage(imageObj.buffer);
                } catch (err) {
                    console.error('Failed to upload image for question:', err);
                }
            }
        }

        if (q.qn) {
            parsedQuestions.push(q);
        }
    }

    return parsedQuestions;
}

module.exports = { parseDocx };
