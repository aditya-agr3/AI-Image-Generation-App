import express from 'express';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
});

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL-E!' });
});

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not set' });
    }

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
      ],
      generationConfig: {
        responseMimeType: 'image/png',
      },
    });

    const imagePart = result?.response?.candidates?.[0]?.content?.parts
      ?.find((part) => part.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      return res.status(500).json({ message: 'No image data returned from Gemini' });
    }

    const image = imagePart.inlineData.data;
    res.status(200).json({ photo: image });
  } catch (error) {
    console.error(error);
    res.status(500).send(error?.response?.data?.error?.message || error?.message || 'Something went wrong');
  }
});

export default router;