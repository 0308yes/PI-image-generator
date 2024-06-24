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
    onGetAllLogs: async (req, res) => {
        const { ID } = req.user
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
            if (!result) {
                return res.status(400).json({
                    success: false,

                });
            }
            else {
                return res.status(200).json({
                    success: true,
                    result
                });
            }

        } catch (err) {
            console.error("Error saving memo:", err);
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    },

    onGenerateImage: async (req, res) => {
        const { ID } = req.user
        const { data_types } = req.body;
        const openAI = new OpenAI()

        try {
            const message = openAI.defineMessage(data_types)
            const isWeekly = false

            const object = await generatePromptAndImage(openAI, message, ID, data_types, isWeekly)
            return res.json(object)

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    onGenerateWeeklyImage: async (req, res) => {
        const { ID } = req.user

        const __filename = fileURLToPath(
            import.meta.url);
        const __dirname = dirname(__filename);

        const {
            startDate,
            endDate
        } = req.body;
        const openAI = new OpenAI()

        try {
            // JSON 파일에서 주간 데이터 가져오기
            const logFilepath = path.join(__dirname, 'public', 'generation_logs.json');
            if (!fs.existsSync(logFilepath)) {
                throw new Error("Log file not found.");
            }
            const logs = JSON.parse(fs.readFileSync(logFilepath));
            // 종료 날짜에 하루 더해서 전체 범위 포함하도록 변경함
            const endDateInclusive = new Date(endDate);
            endDateInclusive.setDate(endDateInclusive.getDate() + 1);

            const data_types = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= new Date(startDate) && logDate < endDateInclusive;
            });

            if (data_types.length === 0) {
                throw new Error("No data found for the specified date range.");
            }

            const message = openAI.defineWeeklyMessage(data_types)
            const isWeekly = true

            const object = await generatePromptAndImage(openAI, message, ID, data_types, isWeekly)
            return res.json(object)
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

async function generatePromptAndImage(openAI, message, ID, data_types, isWeekly) {
    const __filename = fileURLToPath(
        import.meta.url);
    const __dirname = dirname(__filename);

    let generatedPrompt = await openAI.generatePrompt(message)
    let data = await openAI.generateImage(generatedPrompt)

    const imageUrls = data.data.map(image => image.url);
    const timestamp = Date.now();
    const imageFilename = `image_${timestamp}.png`;
    const imageFilepath = path.join(__dirname, '..', '..', 'public', 'images', imageFilename); // 경로 수정

    await saveImageToFile(imageUrls[0], imageFilepath);

    const imagePath = `/images/${imageFilename}`
    const logResult = await UserDataModel.createLogById(ID, data_types, generatedPrompt, imagePath, isWeekly);

    return {
        imageUrls,
        prompt: generatedPrompt,
        savedFilePath: imageFilepath,
        logResult: logResult,
    };
}

async function saveImageToFile(url, filepath) {
    const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    console.log(`Image saved to ${filepath}`);
}

