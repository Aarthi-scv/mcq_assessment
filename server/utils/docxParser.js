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

    // Split by labels
    const chunks = html.split(/===QUESTION START===/g);
    const parsedQuestions = [];

    for (const chunk of chunks) {
        if (!chunk.trim() || !chunk.includes('===QUESTION END===')) continue;

        const content = chunk.split(/===QUESTION END===/)[0];

        // Simple regex parsing of the HTML content
        // We expect lines like:
        // 1. Question text <img src="{{IMG_...}}">
        // A) Option A
        // B) Option B
        // ...
        // Answer: A
        // Explanation: ...

        const q = {
            qn: '',
            options: [],
            answer: '',
            explanation: '',
            questionImage: null
        };

        // Extract Question Text
        // It's usually the first part before A) 
        const qnMatch = content.match(/^(?:<p>)?(\d+\.[\s\S]*?)(?:<p>)?\s*[A-D]\)/);
        if (qnMatch) {
            q.qn = qnMatch[1].replace(/<[^>]*>/g, ' ').trim();

            // Check for image placeholder in qn text
            const imgPlaceholder = qnMatch[1].match(/{{(IMG_.*?)}}/);
            if (imgPlaceholder) {
                q.questionImagePlaceholder = imgPlaceholder[1];
            }
        }

        // Extract Options
        const optAMatch = content.match(/A\)\s*([\s\S]*?)(?:<p>)?\s*B\)/);
        const optBMatch = content.match(/B\)\s*([\s\S]*?)(?:<p>)?\s*C\)/);
        const optCMatch = content.match(/C\)\s*([\s\S]*?)(?:<p>)?\s*D\)/);
        const optDMatch = content.match(/D\)\s*([\s\S]*?)(?:<p>)?\s*Answer:/);

        q.options = [
            optAMatch ? optAMatch[1].replace(/<[^>]*>/g, ' ').trim() : '',
            optBMatch ? optBMatch[1].replace(/<[^>]*>/g, ' ').trim() : '',
            optCMatch ? optCMatch[1].replace(/<[^>]*>/g, ' ').trim() : '',
            optDMatch ? optDMatch[1].replace(/<[^>]*>/g, ' ').trim() : ''
        ];

        // Extract Answer
        const ansMatch = content.match(/Answer:\s*([A-D])/);
        if (ansMatch) {
            q.answerLetter = ansMatch[1];
            q.answer = q.options[['A', 'B', 'C', 'D'].indexOf(q.answerLetter)];
        }

        // Extract Explanation
        const expMatch = content.match(/Explanation:\s*([\s\S]*)$/);
        if (expMatch) {
            q.explanation = expMatch[1].replace(/<[^>]*>/g, ' ').trim();
        }

        // If we have a placeholder, find the image and upload it
        if (q.questionImagePlaceholder) {
            const imageObj = images.find(img => img.imageId === q.questionImagePlaceholder);
            if (imageObj) {
                try {
                    q.questionImage = await uploadImage(imageObj.buffer);
                } catch (err) {
                    console.error('Failed to upload image for question:', err);
                }
            }
            delete q.questionImagePlaceholder;
        }

        if (q.qn) {
            parsedQuestions.push(q);
        }
    }

    return parsedQuestions;
}

module.exports = { parseDocx };
