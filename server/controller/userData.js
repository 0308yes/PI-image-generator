import UserDataModel from '../models/userData.js';
import {
    OpenAI
} from '../../public/communication/openAI.js';
import path from 'path'
import {
    fileURLToPath
} from 'url';
import {
    dirname
} from 'path';
import fs from 'fs';

export default {

    //
    onGetAllLogsById: async (req, res) => {
        const ID = req.query.id
        try {
            const result = await UserDataModel.getAllLogsById(ID);
            if (result.length == 0) {
                return res.status(400).json({
                    success: false
                });
            } else {
                return res.status(200).json({
                    success: true,
                    result

                })
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error
            })
        }
    },
    onSaveMemo: async (req, res) => {
        const {
            timestamp,
            memo
        } = req.body;

        try {
            const result = await UserDataModel.saveMemo(timestamp, memo)
            return res.status(200).json({
                success: true,
                result
            });

        } catch (err) {
            console.error("Error saving memo:", err);
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },

    onGenerateImage: async (req, res) => {
        const __filename = fileURLToPath(
            import.meta.url);
        const __dirname = dirname(__filename);

        const {
            ID,
            data_types,
            isWeekly
        } = req.body;
        const openAI = new OpenAI()
        const message = openAI.defineMessage(data_types)
        let generatedPrompt = await openAI.generatePrompt(message)
        let data = await openAI.generateImage(generatedPrompt)

        const imageUrls = data.data.map(image => image.url);
        const timestamp = Date.now();
        const imageFilename = `image_${timestamp}.png`;
        const imageFilepath = path.join(__dirname, '..', '..', 'public', 'images', imageFilename); // 경로 수정

        await saveImageToFile(imageUrls[0], imageFilepath);

        const imagePath = `/images/${imageFilename}`
        const logResult = await UserDataModel.createLogById(ID, data_types, generatedPrompt, imagePath, isWeekly);

        res.json({
            imageUrls,
            prompt: generatedPrompt,
            savedFilePath: imageFilepath,
            logResult: logResult,
        });
    }
}

async function saveImageToFile(url, filepath) {
    const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    console.log(`Image saved to ${filepath}`);
}