import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const auth = async (req, res, next) => {
    try {

        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use secret from environment variables
        const user = await User.findOne({ ID: decoded.ID, auth_type: decoded.auth_type });

        if (!user) {
            throw new Error();
        }
        req.user = user;
        next();
    }

    catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
}
export default auth;
