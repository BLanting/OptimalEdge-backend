import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai"; // ✅ Correct Import
import nodemailer from "nodemailer";

dotenv.config();
const app = express();

// ✅ Allow CORS from both local (development) and production (GoDaddy)
const allowedOrigins = [
  "http://localhost:8080", // Local testing
  "https://optimaledge.ai", // Production (replace with actual domain)
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    credentials: true, // Allow cookies/authentication if needed
  })
);

app.use(express.json());

dotenv.config();

const PORT = process.env.PORT || 5000;

// 🔍 Debugging: Print API Key
console.log("🔑 Checking API Key at Startup:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ NOT LOADED");

// ✅ Ensure API Key is Loaded
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ ERROR: OpenAI API Key is missing! Make sure it's in your .env file.");
    process.exit(1); // Stop the server if the API key is missing
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
    console.log("📩 Incoming Chat Request:", req.body);

    try {
        const messages = req.body.messages || [];

        console.log("📨 Sending Messages to OpenAI:", JSON.stringify(messages, null, 2));

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: messages,
        });

        console.log("✅ OpenAI Response:", completion);

        const aiResponse = completion.choices[0].message.content;
        res.json({ message: aiResponse });
    } catch (error) {
        console.error("❌ OpenAI API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "OpenAI API request failed", details: error.message });
    }
});


// Create a transporter object using Gmail's SMTP server
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'OptimalEdgeAI@gmail.com',
      pass: 'gihu cbbk zihp arvu' // Replace with the app password you generated
    }
  });
  
  // Function to send an email
  const sendEmail = async (subject, text) => {
    const mailOptions = {
      from: 'OptimalEdgeAI@gmail.com',
      to: 'OptimalEdgeAI@gmail.com', // Replace with your desired recipient
      subject: subject,
      text: text
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  // Endpoint to handle incoming chat transcripts
app.post('/api/send-email', async (req, res) => {
    const { transcript } = req.body;
    console.log('sending email')
    if (!transcript) {
      return res.status(400).send('Transcript is required');
    }
  
    const formattedTranscript = transcript
    .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
    .join("\n");  

    const subject = 'New Chat Transcript';
    const text = `Chat Transcript:\n\n${formattedTranscript}`;
  
    try {
      await sendEmail(subject, text);
      res.status(200).send('Email sent successfully');
    } catch (error) {
      res.status(500).send('Error sending email');
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
