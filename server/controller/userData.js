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
import { log } from 'console';
import fetch from 'node-fetch'; // 추가

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
        const { ID, data_category } = req.user
        const { data_types } = req.body;
        const openAI = new OpenAI()

        try {
            const message = openAI.defineMessage(data_types, data_category)
            console.log('m', message)
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
        const { ID, data_category } = req.user

        const {
            startDate,
            endDate
        } = req.body;
        const openAI = new OpenAI()
        try {
            const result = await UserDataModel.getAllLogsById(ID);
            if (result.length == 0) {
                return res.status(400).json({
                    success: false
                });

            } else {
                const endDateInclusive = new Date(endDate);
                endDateInclusive.setDate(endDateInclusive.getDate() + 1);


                const data_types = result.filter(log => {
                    const logDate = new Date(log.timestamp);

                    return logDate >= new Date(startDate) && logDate < endDateInclusive && !log.isWeekly;
                })
                if (data_types.length === 0) {
                    throw new Error("No data found for the specified date range.");
                }
                const message = openAI.defineWeeklyMessage(data_types, data_category)

                const isWeekly = true

                const object = await generatePromptAndImage(openAI, message, ID, data_types, isWeekly)
                return res.json(object)
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error
            })
        }
    }
}


// async function generatePromptAndImage(openAI, message, ID, data_types, isWeekly) {
//     const __filename = fileURLToPath(
//         import.meta.url);
//     const __dirname = dirname(__filename);

//     let generatedPrompt = await openAI.generatePrompt(message)
//     let data = await openAI.generateImage(generatedPrompt)

//     const imageUrls = data.data.map(image => image.url);
//     const timestamp = Date.now();
//     const imageFilename = `image_${timestamp}.png`;
//     const imageFilepath = path.join(__dirname, '..', '..', 'public', 'images', imageFilename); // 경로 수정

//     await saveImageToFile(imageUrls[0], imageFilepath);

//     const imagePath = `/images/${imageFilename}`
//     const logResult = await UserDataModel.createLogById(ID, data_types, generatedPrompt, imagePath, isWeekly);

//     return {
//         imageUrls,
//         prompt: generatedPrompt,
//         savedFilePath: imageFilepath,
//         logResult: logResult,
//     };
// }

async function saveImageToFile(url, filepath) {
    const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    console.log(`Image saved to ${filepath}`);
}


////////// 추가한 부분
async function downloadImageAsBase64(url) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const base64Image = buffer.toString('base64');
    return base64Image;
}

async function generatePromptAndImage(openAI, message, ID, data_types, isWeekly) {
    let generatedPrompt = await openAI.generatePrompt(message);
    let data = await openAI.generateImage(generatedPrompt);

    const imageUrls = data.data.map(image => image.url);

    // 이미지를 다운로드하여 base64로 인코딩
    const base64Image = await downloadImageAsBase64(imageUrls[0]);

    const logResult = await UserDataModel.createLogById(ID, data_types, generatedPrompt, base64Image, isWeekly);

    return {
        imageUrls: [base64Image], // base64 이미지 반환
        prompt: generatedPrompt,
        logResult: logResult,
    };
}

