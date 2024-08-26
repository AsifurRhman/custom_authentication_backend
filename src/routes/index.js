import express from 'express';
import userRoutes from '../modules/user/user.route.js';



const router = express.Router();


router.use("/api/user", userRoutes);





export default router;
