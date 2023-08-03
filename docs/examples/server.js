import express from 'express';
import Librespot from 'dev-librespot';
import dotenv from 'dotenv'

dotenv.config();

const spotify = new Librespot({
  sessionOptions: {
    handshakeOptions: {
      product: 0x0,
      platform: 0x2,
      productFlags: [0],
      version: 117300517
    }
  }
});

const app = express();

app.listen(3000, async () => {
  await spotify.login(process.env.EMAIL, process.env.PASSWORD)
  console.log('listening on port 3000...');
})

app.get('/stream', async (req, res) => {
  const track = await spotify.get.track('4rXLjWdF2ZZpXCVTfWcshS');
  
  const { stream } = track;

  res.set({
    'Content-Type': 'audio/ogg'
  });

  stream.pipe(res);
})