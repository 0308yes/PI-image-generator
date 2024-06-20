require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 제공 경로 설정

//-------------- GPT로 이미지 프롬프트 생성
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
            4. When creating keywords, reflect the interpretation of the quantitative data rather than the type of data itself. For example, interpret "24-minute exercise" creatively instead of simply noting "exercise". The image should embody these keywords in a creative manner. Do not include numbers, letters, or text in the drawing. Do not draw objects that directly depict “physical activity” and “personal data”. Do not draw a road, trail, or path.
            5. Upon regeneration, ensure the new image is based on different subjects or keywords from the previous one.
            6. The subject, mood, texture, and style of the image should vary with each generation to maintain diversity and creativity.
             7. Draw in one of the following styles: painting, photo, sketch, cartoon, impressionist, abstract, renaissance.
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

//-------------- 이미지 저장
async function saveImageToFile(url, filepath) {
    const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    console.log(`Image saved to ${filepath}`);
}

//-------------- 이미지 메타데이터
async function logGenerationDetails(move, exercise, stand, steps, distance, prompt, imageFilepath) {
    const logData = {
        timestamp: new Date().toISOString(),
        move,
        exercise,
        stand,
        steps,
        distance,
        prompt,
        imageFilepath
    };

    const logFilepath = path.join(__dirname, 'public', 'generation_logs.json');
    let logs = [];
    if (fs.existsSync(logFilepath)) {
        logs = JSON.parse(fs.readFileSync(logFilepath));
    }
    logs.push(logData);
    fs.writeFileSync(logFilepath, JSON.stringify(logs, null, 2));
    console.log('Generation details logged.');
}

//-------------- DALL-E 이미지 생성
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
            const imageFilename = `image_${timestamp}.png`;
            const imageFilepath = path.join(__dirname, 'public', 'images', imageFilename); // 경로 수정
            const logFilepath = path.join(__dirname, 'public', 'generation_logs.json');

            await saveImageToFile(imageUrls[0], imageFilepath);
            await logGenerationDetails(move, exercise, stand, steps, distance, generatedPrompt, `/images/${imageFilename}`);

            res.json({ imageUrls, prompt: generatedPrompt, savedFilePath: imageFilepath });
        } else {
            console.error('OpenAI API Error:', data);
            res.status(500).json({ error: 'Failed to generate image', details: data });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate image', details: error });
    }
});

app.get('/logs', (req, res) => {
    const logFilepath = path.join(__dirname, 'public', 'generation_logs.json');
    if (fs.existsSync(logFilepath)) {
        const logs = JSON.parse(fs.readFileSync(logFilepath));
        res.json(logs);
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
