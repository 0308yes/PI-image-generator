export class OpenAI {
    constructor() {
        this.fetch = null
        this.promptGenerationRule = `
            Image Generation Rules:
            1. Extract keywords based on the interpretation of the data before generating the image. The image should be generated based on these keywords.
            2. Do not include any numbers, letters, or text in the drawing.
            3. Generate an image that is not easily associated with the data provided, ensuring creativity and originality.
            4. When creating keywords, reflect the interpretation of the quantitative data rather than the type of data itself. For example, interpret "24-minute exercise" creatively instead of simply noting "exercise". The image should embody these keywords in a creative manner. Do not include numbers, letters, or text in the drawing. Do not draw objects that directly depict “physical activity” and “personal data”. Do not draw a road, trail, or path.
            5. Upon regeneration, ensure the new image is based on different subjects or keywords.
            6. The subject, mood, texture, and style of the image should vary with each generation to maintain diversity and creativity.
            7. Draw in one of the following styles: painting, photo, sketch, cartoon, impressionist, abstract, renaissance.
            `
    }

    async init() {
        this.fetch = await import('node-fetch').then(mod => mod.default);
    }

    defineMessage(data_types, data_category) {
        let data_type_keys = Object.keys(data_types);
        let userMessageContent = `You will be provided with the personal data related to ${data_category} of a day, including "`;

        data_type_keys.forEach((key, index) => {
            userMessageContent += `${key}:${data_types[key]}`;
            if (index < data_type_keys.length - 1) {
                userMessageContent += ", ";
            } else {
                userMessageContent += ".";
            }
        });
        console.log(userMessageContent)

        const message = [{
            role: "system",
            //content: 'You are a helpful assistant who creates image prompts. Your goal is to support self-reflection by creating an image that reflects the interpretation of personal data. You will be provided with the user’s ${data_category} data to inspire an image. Your task is to create a creative and original image prompt for DALL-E to produce an image that is inspired by your interpretation of this data. The output should only be the image prompt.',
            content: `You are a helpful assistant who creates image prompts. Your goal is to support self-reflection by creating an image that reflects the interpretation of personal data. Given the user's ${data_category} data, you will be creating a creative and original image prompt for DALL-E to produce an image that is inspired by your interpretation of this data. The output should only be the image prompt.`,
        },
        {
            role: "user",
            content: userMessageContent
        },
        {
            role: "system",
            content: this.promptGenerationRule
        }
        ];
        return message
    }

    defineWeeklyMessage(weeklyData, data_category) {
        //weeklyData = object [{},{}]
        const weeklyDataText = weeklyData.map(log => {
            let userMessageContent = ""
            userMessageContent += new Date(log.timestamp).toLocaleDateString() + ':';
            const data_type_keys = Object.keys(log.data_types);

            data_type_keys.forEach((key, index) => {
                userMessageContent += `${key}:${log.data_types[key]}`;
                if (index < log.data_types.length - 1) {
                    userMessageContent += ", ";
                } else {
                    userMessageContent += ".";
                }
            })
            return userMessageContent
        }).join('\n');

        const message = [{
            role: "system",
            content: `You are a helpful assistant who creates image prompts. Your goal is to support self-reflection by creating an image that reflects the interpretation of personal data. Given the user's weekly ${data_category} data, you will be creating a creative and original image prompt for DALL-E to produce an image that is inspired by your interpretation of this weekly data. The output should only be the image prompt.`
        },
        {
            role: "user",
            content: `Weekly ${data_category} data:\n${weeklyDataText}`
        },
        {
            role: "system",
            content: this.promptGenerationRule
        }
        ];
        return message


    }

    async generatePrompt(message) {
        console.log('mem', message)
        if (!this.fetch) {
            await this.init();
        }
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: message,
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

    async generateImage(prompt) {
        if (!this.fetch) {
            await this.init();
        }

        try {
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'dall-e-3',
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                }),
            });
            const data = await response.json();
            console.log('DALL-E response data:', data); // 디버깅 로그
            return data

        } catch (error) {
            console.error('Error generating imasge:', error);
            throw new Error('Failed to generate prompt');
        }

    }


}