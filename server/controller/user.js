import UserModel, { USER_AUTH_TYPES } from '../models/user.js';
import path from 'path';
import jwt from 'jsonwebtoken';

export default {
    onCreateUser: async (req, res) => {
        const { ID, password, data_types, auth_type } = req.body;
        try {
            const user = await UserModel.getUserById(ID);
            if (!user) {
                const user = await UserModel.createUser(ID, password, data_types, auth_type);
                return res.status(200).json({ success: true, user });
            }
            else {
                return res.status(200).json({ success: false, error: "user already exists" });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    },

    onGetUserById: async (req, res) => {
        const userId = req.query.id
        try {
            const user = await UserModel.getUserById(userId);
            return res.status(200).json({ success: true, user });
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    },

    onLoginUser: async (req, res) => {
        const { ID, password, } = req.body;
        try {
            const user = await UserModel.getUserById(ID);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "No User with this ID"
                });
            }
            if (password == user.password) {
                console.log(user.ID, user.auth_type, process.env.JWT_SECRET)
                const token = jwt.sign({ ID: user.ID, auth_type: user.auth_type }, process.env.JWT_SECRET);

                let redirectUrl = null
                if (user.auth_type == USER_AUTH_TYPES.ADMINISTRATOR) {
                    console.log('admin')
                    redirectUrl = '/admin.html'
                }
                //일반 참여자 
                else {
                    console.log('user')
                    redirectUrl = '/userPage.html'
                }
                return res.json({ success: true, redirectUrl, token });
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: "password wrong"
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    },

    onGetAllUsers: async (req, res) => {
        try {
            const users = await UserModel.getAllUsers();
            if (users.length == 0) {
                return res.status(400).json({
                    success: false,
                    message: "No Users"
                });
            }
            return res.status(200).json({ success: true, users });
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    },

    onDeleteUserById: async (req, res) => {
        try {

            const { ID, } = req.body;
            const user = await UserModel.deleteUserById(ID);
            if (!user) {
                return res.status(400).json({ error: "no User Found" });
            }

            return res.status(200).json({
                success: true,
                message: `Deleted ${user.name}`
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    },

    onDeleteAllUsers: async (req, res) => {

        try {
            const users = await UserModel.deleteAllUsers()
            if (users.length == 0 || !users) {
                console.log('hi')
                return res.status(200).json({ success: true, users });
            }
            console.log('hi')
            return res.status(400).json({
                success: false,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    },
}