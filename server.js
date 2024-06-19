require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(express.static('public'));

// GPT로 이미지 프롬프트 생성
async function generatePrompt(move, exercise, stand, steps, distance) {
    const fetch = await import('node-fetch').then(mod => mod.default); 
    const messages = [
        {
            role: "system",
            content: `You are an assistant that creates images to support self-reflection by interpreting personal data. Given the user's physical activity data, create an image that reflects your interpretation of this data using DALL-E. Your goal is to generate a creative and original image prompt for DALL-E to produce an image. The output should only be the image prompt.`
        },
        {
            role: "user",
            content: `You will be provided with the personal data related to physical activity of a day, including move: ${move} KCAL, exercise: ${exercise} minutes, stand: ${stand} times, steps: ${steps}, and distance: ${distance} KM.`
        },
        {
            role: "system",
            content: `
            Image Generation Rules:
            1. Extract keywords based on the interpretation of the data before generating the image. The image should be generated based on these keywords.
            2. Do not include any numbers, letters, or text in the drawing.
            3. Generate an image that is not easily associated with the data provided, ensuring creativity and originality.
            4. When creating keywords, reflect the interpretation of the quantitative data rather than the type of data itself. For example, interpret "24-minute exercise" creatively instead of simply noting "exercise". The image should embody these keywords in a creative manner. Do not include numbers, letters, or text in the drawing. Avoid drawing objects that directly depict “physical activity” and “personal data”.
            5. Upon regeneration, ensure the new image is based on different subjects or keywords from the previous one.
            6. The subject, mood, texture, and style of the image should vary with each generation to maintain diversity and creativity.
            `
        }
    ];

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messages,
                max_tokens: 150
            }),
        });

        const data = await response.json();
        console.log('GPT response data:', data); // 디버깅 로그

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('No choices returned from GPT');
        }
    } catch (error) {
        console.error('Error generating prompt:', error);
        throw new Error('Failed to generate prompt');
    }
}

async function saveImageToFile(url, filepath) {
    const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    console.log(`Image saved to ${filepath}`);
}

app.post('/generate-image', async (req, res) => {
    const { move, exercise, stand, steps, distance } = req.body;

    try {
        const generatedPrompt = await generatePrompt(move, exercise, stand, steps, distance);
        const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: generatedPrompt,
                n: 1,
                size: "1024x1024",
            }),
        });

        const data = await response.json();
        console.log('DALL-E response data:', data); // 디버깅 로그

        if (response.ok) {
            const imageUrls = data.data.map(image => image.url);
            const timestamp = Date.now();
            const filepath = path.join(__dirname, 'images', `image_${timestamp}.png`);

            await saveImageToFile(imageUrls[0], filepath);

            res.json({ imageUrls, prompt: generatedPrompt, savedFilePath: filepath });
        } else {
            console.error('OpenAI API Error:', data);
            res.status(500).json({ error: 'Failed to generate image', details: data });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate image', details: error });
    }
});

app.post('/upload-csv', upload.single('csvFile'), (req, res) => {
    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log('CSV data:', results);

            // CSV 첫 번째 행 데이터 사용
            const { move, exercise, stand, steps, distance } = results[0];

            try {
                const generatedPrompt = await generatePrompt(move, exercise, stand, steps, distance);
                const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
                const response = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: 'dall-e-3',
                        prompt: generatedPrompt,
                        n: 1,
                        size: "1024x1024",
                    }),
                });

                const data = await response.json();
                console.log('DALL-E response data:', data); // 디버깅 로그

                if (response.ok) {
                    const imageUrls = data.data.map(image => image.url);
                    const timestamp = Date.now();
                    const filepath = path.join(__dirname, 'images', `image_${timestamp}.png`);

                    await saveImageToFile(imageUrls[0], filepath);

                    res.json({ imageUrls, savedFilePath: filepath });
                } else {
                    console.error('OpenAI API Error:', data);
                    res.status(500).json({ error: 'Failed to generate image', details: data });
                }
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Failed to generate image', details: error });
            }

            fs.unlinkSync(filePath); // CSV 파일 삭제
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
