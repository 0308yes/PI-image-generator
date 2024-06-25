import express from 'express';
import cors from 'cors';
import fs from 'fs';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt'
import path from 'path'
import {
    fileURLToPath
} from 'url';
import {
    dirname
} from 'path';
import "./server/mongo.js"
import userRouter from "./server/routers/user.js";
import userDataRouter from "./server/routers/userData.js";


const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 제공 경로 설정

app.use(userRouter);
app.use(userDataRouter);


//이미지 파일 저장 
async function saveImageToFile(url, filepath) {
    const fetch = await import('node-fetch').then(mod => mod.default); // 동적 import 사용
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
    console.log(`Image saved to ${filepath}`);
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});