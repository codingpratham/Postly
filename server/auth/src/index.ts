import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth.r.js";
const app = express();

const PORT = process.env.PORT1 || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api',authRouter);

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});