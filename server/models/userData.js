import mongoose from "mongoose";

import {
    v4 as uuidv4
} from "uuid";


const userDataSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => uuidv4().replace(/\-/g, ""),
    },
    ID: String,
    data_types: mongoose.Schema.Types.Mixed,
    imagePrompt: String,
    imagePath: String,
    timestamp: String,
    isWeekly: Boolean,
    memo: String,

}, {
    timestamps: true,
    collection: "logs",
});


userDataSchema.statics.getAllLogsById = async function (
    ID,
) {
    try {
        const data = await this.find({
            ID: ID
        });

        return data
    } catch (error) {
        throw error;
    }
}

userDataSchema.statics.createLogById = async function (
    ID,
    data_types,
    imagePrompt,
    imagePath,
    isWeekly,

) {
    try {
        const data = await this.create({
            ID,
            data_types,
            imagePrompt,
            imagePath,
            timestamp: new Date().toISOString(),
            isWeekly: isWeekly
        })
        return data
    } catch (error) {
        throw error;
    }
}

userDataSchema.statics.createMemo = async function (
    timestamp,
    memo
) {
    try {
        const result = await this.updateOne({
            'timestamp': timestamp
        }, {
            $set: {
                'memo': memo
            }
        });
        return result
    } catch (error) {
        throw error;
    }

}


export default mongoose.model("UserData", userDataSchema);