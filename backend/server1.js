import express, { json, urlencoded } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connect, Schema, model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(json())

app.use(urlencoded({ extended: true }))

await connect(process.env.MONGO_URI);

const userSchema = new Schema({
  username: String,
  password: String,
});

const msgSchema = new Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});


const Msg = model('Msg', msgSchema);
const User = model('User', userSchema);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser == null) {
            const newUser = new User({ username, password });
            await newUser.save();
            return res.status(201).json({ message: 'Signup successful.' });
        } else if (existingUser) {
            if (existingUser.password !== password) {
                return res.status(401).json({ error: 'Invalid username or password.' });
            }
            return res.status(200).json({ message: 'Login successful.' });
        } else {
            return res.status(400).json({ error: 'Invalid mode. Use "login" or "signup".' });
        }
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/messages', async (req, res) => {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
        return res.status(400).json({ error: 'user1 and user2 are required.' });
    }
    try {
        const msgs = await Msg.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 }
            ]
        }).sort({ createdAt: 1 });
        res.status(200).json(msgs);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/users', async (req, res) => {
    app.post('/messages', async (req, res) => {
        try {
            const { sender, receiver, message } = req.body;
            if (!sender || !receiver || !message) {
                return res.status(400).json({ error: 'Sender, receiver, and message are required.' });
            }

            const senderUser = await User.findOne({ username: sender });
            if (!senderUser) {
                return res.status(404).json({ error: 'Sender does not exist.' });
            }

            const receiverUser = await User.findOne({ username: receiver });
            if (!receiverUser) {
                return res.status(404).json({ error: 'Receiver does not exist.' });
            }

            const newMsg = new Msg({ sender, receiver, message });
            await newMsg.save();
            return res.status(201).json({ message: 'Message sent successfully.' });
        } catch (error) {
            console.error('Error occurred:', error);
            res.status(500).send('Internal Server Error');
        }
    });
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

httpServer.listen(port, () => {
  console.log(`Chat app listening on port ${port}`)
})