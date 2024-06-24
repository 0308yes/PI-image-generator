import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

export const USER_AUTH_TYPES = {
    PARTIPANT: "participant",
    ADMINISTRATOR: "administrator",
};

import {
    v4 as uuidv4
} from "uuid";


const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => uuidv4().replace(/\-/g, ""),
    },
    ID: {
        type: String,
        required: true,
        unique: true,
    }
    ,
    password: { type: String, required: true },

    data_types: String,
    data_category: String,
    auth_type: {
        type: String,
        enum: [USER_AUTH_TYPES.ADMINISTRATOR, USER_AUTH_TYPES.PARTIPANT],
        required: true,
        default: () => USER_TYPES.PARTIPANT
    }
}, {
    timestamps: false,
    collection: "login",
});

userSchema.methods.generateAuthToken = function () {
    const user = this;
    const token = jwt.sign({ ID: user.ID.toString(), auth_type: user.auth_type }, process.env.JWT_SECRET);
    return token;
};

//static method
//this ensures performing operations on the userSchema object
userSchema.statics.createUser = async function (
    ID,
    password,
    data_types,
    data_category,
    auth_type
) {

    try {
        const user = await this.create({
            ID,
            password,
            data_types,
            data_category,
            auth_type
        });
        console.log(user)
        return user;
    } catch (error) {
        throw error;
    }
}

userSchema.statics.getUserById = async function (ID) {
    try {
        const user = await this.findOne({ ID: ID });
        return user;
    } catch (error) {
        throw error;
    }
}

userSchema.statics.getAllUsers = async function () {
    try {
        const users = await this.find();
        return users;
    } catch (error) {
        throw error;
    }
}

userSchema.statics.deleteUserById = async function (ID) {
    try {
        const user = await this.findOne({ ID: ID });
        const result = await this.deleteOne({ ID: ID });

        return user
    } catch (error) {
        throw error;
    }
}

userSchema.statics.deleteAllUsers = async function () {
    try {
        const result = await this.deleteMany({});
        const users = await this.find();

        return users
    } catch (error) {
        throw new Error('Error deleting users: ' + error.message);
    }
}

export default mongoose.model("User", userSchema);