import express, { json, urlencoded } from 'express';
import cors from 'cors';
import { connect, Schema, model } from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from "http";
import { Server } from "socket.io";
import webpush from 'web-push';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// Configure Web Push VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:example@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const io = new Server(httpServer, {
  cors: {
    origin: "*", // or set to your frontend URL like "http://localhost:5173"
    methods: ["GET", "POST"],
    credentials: true
  }
});

const userMap = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.emit("join");
  socket.on("join", (username) => {
  console.log(`${username} has joined the chat`);
  userMap.set(username, socket.id);
});

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    console.log("User map:", userMap);
  });
});


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
const subscriptionSchema = new Schema({
  username: { type: String, required: true, unique: true },
  subscription: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Subscription = model('Subscription', subscriptionSchema);

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

// Return VAPID public key for client subscription
app.get('/vapidPublicKey', (req, res) => {
  return res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY || '' });
});

// Save or update a user's push subscription
app.post('/subscribe', async (req, res) => {
  try {
    const { username, subscription } = req.body;
    if (!username || !subscription) {
      return res.status(400).json({ error: 'username and subscription are required.' });
    }
    await Subscription.findOneAndUpdate(
      { username },
      { username, subscription, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json({ message: 'Subscription saved.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return res.status(500).send('Internal Server Error');
  }
});

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

app.get('/users', async (req, res) => {try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal Server Error');
    }});

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
        console.log(userMap);
        console.log(`Message from ${sender} to ${receiver}: ${message} at ${userMap.get(receiver)}`);
        // Emit to both sender and receiver sockets
        io.to(userMap.get(receiver)).emit("message", newMsg);
        // Attempt to send Web Push notification to receiver
        try {
            if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
                const subDoc = await Subscription.findOne({ username: receiver });
                if (subDoc && subDoc.subscription) {
                    const payload = JSON.stringify({
                        title: `New message from ${sender}`,
                        body: message,
                        data: { sender, receiver }
                    });
                    await webpush.sendNotification(subDoc.subscription, payload).catch(async (err) => {
                        console.error('Push send failed:', err?.statusCode || err);
                        if (err?.statusCode === 410 || err?.statusCode === 404) {
                            try { await Subscription.deleteOne({ username: receiver }); } catch {}
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Error during push notify:', e);
        }
        return res.status(201).json({ message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

httpServer.listen(port, () => {
  console.log(`Chat app listening on port ${port}`)
})