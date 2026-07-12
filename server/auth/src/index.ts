import "dotenv/config";
import express from "express";

const app = express();

const PORT = process.env.PORT1 || 3000;

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});