export class OpenAI {
    constructor() {
        this.fetch = null
        this.promptGenerationRule = `
            [Image Generation Rules]
            1. Extract keywords based on the interpretation of the data before generating the image. Keywords can include scenes, objects, landscapes, colors, patterns, moods, etc. The image should be generated based on these keywords.
            2. When creating keywords, reflect the interpretation of the data rather than the type of data itself. For example, interpret "24-minute exercise" creatively instead of simply noting "exercise". The image should embody these keywords in a creative manner. Do not draw objects that directly depict the data type and “personal data” itself.
            3. Do not include any numbers, letters, or text in the image.
            4. Generate an image that is not easily associated with the data provided, ensuring creativity and originality.
            5. Avoid repetitive image prompts by using diverse keywords and styles. The subject, mood, texture, and style of the image should vary to maintain diversity and creativity.
            6. Draw in one of the following styles: 
            - Medium: painting, photo, sketch, cartoon, icon, vector, graffiti, 3D render
            - West Figurative Premodern: Baroque, High Renaissance, Impressionism, Medieval, Pointillism, Neoclassicism
            - West Figurative Modern: Pop Art, Surrealism, documentary photography, Art deco, Hippie movement, photorealism
            - Non-West Abstract Modern: Ukiyo-e, Chinese ink wash painting, Kerala mural, Mayan art, African masks, ancient Egyptian art, thangka
            - Non-West Abstract Modern: Mola art, Geometric Islamic art, Mexican Otomi, Andean textile, Aboriginal art
            - West Abstract Modern: action painting, Op art, Bauhaus, Cubism, Dadaism, Futurism
            7. Response should only be the image prompt, do not give any prefix such as “prompt”, “image prompt”, or “prompts for DALL-E” and do not use double quotes at the start and end of the response. 

`
    }

    async init() {
        this.fetch = await import('node-fetch').then(mod => mod.default);
    }

    defineMessage(data_types, data_category) {
        let data_type_keys = Object.keys(data_types);
        let userMessageContent = `${data_category} of a day: `;

        // data_type_keys.forEach((key, index) => {
        //     userMessageContent += `${key}:${data_types[key]}`;
        //     if (index < data_type_keys.length - 1) {
        //         userMessageContent += ", ";
        //     } else {
        //         userMessageContent += ".";
        //     }
        // });

        // 인풋 입력 안하는 경우도 포함
        data_type_keys.forEach((key, index) => {
            if (data_types[key]) {
                userMessageContent += `${key}:${data_types[key]}`;
            } else {
                userMessageContent += `${key}: `;
            }
    
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
            content: `You are an assistant who creates image prompts. Your goal is to support self-reflection by creating an image that reflects the interpretation of personal data. You will be provided with the personal data related to “${data_category} of a day”. Given the user's ${data_category} data, your task is to create a creative and original image prompt for DALL-E to produce an image that is inspired by your interpretation of this data. You MUST follow the provided [Image Generation Rules] when generating image prompts. Provide your output in an image prompt format.`,
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
            content: `You are an assistant who creates image prompts. Your goal is to support self-reflection by creating an image that reflects the interpretation of personal data. You will be provided with the personal data related to “Weekly ${data_category} data”. Given the user's weekly ${data_category} data, your task is to create a creative and original image prompt for DALL-E to produce an image that is inspired by your interpretation of this data. You MUST follow the provided [Image Generation Rules] when generating image prompts. Provide your output in an image prompt format.`
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